<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Endereco;
use App\Models\PreferenciaUsuario;
use App\Traits\ManagerGallery;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Traits\SearchIndex;

class UsuarioController extends Controller
{
    use SearchIndex;
    use ManagerGallery;

    protected $campoGaleria = 'imagens';
    protected $storagePath = 'usuarios';
    protected $modeloRelacaoGaleria = Usuario::class;

    /**
     * Lista de usuários (getList)
     */
    public function index(Request $request): JsonResponse
    {
        return $this->SearchIndex(
            $request,
            Usuario::with(['endereco', 'preferencias']),
            'usuarios',
            ['nome', 'email', 'telefone']
        );
    }

    /**
     * Criar um novo usuário com endereço, preferências e imagem opcionais
     */
    public function store(Request $request): JsonResponse
    {
        // Validação
        $validator = Validator::make($request->all(), [
            'nome' => 'required|string|min:2|max:150',
            'email' => 'required|email|max:150|unique:usuarios,email',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/'
            ],
            'cpf' => 'required|string|size:11|regex:/^[0-9]+$/|unique:usuarios,cpf',
            'data_nascimento' => 'required|date|before:today|after:1900-01-01',
            'telefone' => 'nullable|string|size:11|regex:/^[0-9]+$/',
            'role' => 'nullable|string|in:user,admin',

            // Validação da imagem
            'imagem' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:10240',

            'endereco' => 'nullable|array',
            'endereco.cep' => 'nullable|string|max:9',
            'endereco.logradouro' => 'nullable|string|max:255',
            'endereco.numero' => 'nullable|string|max:10',
            'endereco.complemento' => 'nullable|string|max:100',
            'endereco.bairro' => 'nullable|string|max:100',
            'endereco.cidade' => 'nullable|string|max:100',
            'endereco.uf' => 'nullable|string|max:2',

            // Validação das preferências conforme migration
            'preferencias' => 'nullable|array',
            'preferencias.tamanho_pet' => 'nullable|string|in:pequeno,medio,grande',
            'preferencias.tempo_disponivel' => 'nullable|string|in:pouco_tempo,tempo_moderado,muito_tempo',
            'preferencias.estilo_vida' => 'nullable|string|in:baixa,moderada,alta',
            'preferencias.espaco_casa' => 'nullable|string|in:area_pequena,area_media,area_externa',
        ], [
            'nome.required' => 'O nome é obrigatório.',
            'nome.min' => 'O nome deve ter pelo menos 2 caracteres.',
            'nome.max' => 'O nome deve ter no máximo 150 caracteres.',

            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'O e-mail deve ser válido.',
            'email.max' => 'O e-mail deve ter no máximo 150 caracteres.',
            'email.unique' => 'Este e-mail já está em uso.',

            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve ter no mínimo 8 caracteres.',
            'password.confirmed' => 'A confirmação da senha não confere.',
            'password.regex' => 'A senha deve ter no mínimo 8 caracteres, incluir pelo menos 1 letra maiúscula, 1 número e 1 caractere especial.',

            'cpf.required' => 'O CPF é obrigatório.',
            'cpf.size' => 'O CPF deve ter exatamente 11 números.',
            'cpf.regex' => 'O CPF deve conter apenas números.',
            'cpf.unique' => 'Este CPF já está em uso.',

            'data_nascimento.required' => 'A data de nascimento é obrigatória.',
            'data_nascimento.date' => 'A data de nascimento deve ser uma data válida.',
            'data_nascimento.before' => 'A data de nascimento deve ser anterior a hoje.',
            'data_nascimento.after' => 'A data de nascimento deve ser posterior a 01/01/1900.',

            'telefone.size' => 'O telefone deve ter exatamente 11 números.',
            'telefone.regex' => 'O telefone deve conter apenas números.',

            'role.in' => 'O papel do usuário deve ser "user" ou "admin".',

            'imagem.image' => 'O arquivo deve ser uma imagem.',
            'imagem.mimes' => 'A imagem deve ser do tipo: jpeg, jpg, png ou webp.',
            'imagem.max' => 'A imagem deve ter no máximo 10MB.',

            'endereco.array' => 'O campo endereço deve ser um objeto.',
            'preferencias.array' => 'O campo preferências deve ser um objeto.',

            // Mensagens de validação das preferências
            'preferencias.tamanho_pet.in' => 'O tamanho do pet deve ser: pequeno, medio ou grande.',
            'preferencias.tempo_disponivel.in' => 'O tempo disponível deve ser: pouco_tempo, tempo_moderado ou muito_tempo.',
            'preferencias.estilo_vida.in' => 'O estilo de vida deve ser: baixa, moderada ou alta.',
            'preferencias.espaco_casa.in' => 'O espaço da casa deve ser: area_pequena, area_media ou area_externa.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $endereco = is_array($request->input('endereco')) ? $request->input('endereco') : [];
        $preferencias = is_array($request->input('preferencias')) ? $request->input('preferencias') : [];

        try {
            return DB::transaction(function () use ($request, $endereco, $preferencias) {
                // Upload da imagem
                $imagemPath = null;
                if ($request->hasFile('imagem')) {
                    $imagem = $request->file('imagem');
                    $imagemNome = time() . '_' . uniqid() . '.' . $imagem->getClientOriginalExtension();
                    $imagemPath = $imagem->storeAs('usuarios', $imagemNome, 'public');
                }

                $usuario = Usuario::create([
                    'nome' => $request->nome,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'cpf' => $request->cpf,
                    'data_nascimento' => $request->data_nascimento,
                    'telefone' => $request->telefone,
                    'role' => $request->role ?? 'user',
                    'imagem' => $imagemPath,
                ]);

                // Criar endereço se fornecido
                if (!empty($endereco) && is_array($endereco) && count(array_filter($endereco, fn($v) => $v !== null && $v !== '')) > 0) {
                    $enderecoData = $endereco;
                    $enderecoData['id_usuario'] = $usuario->id;
                    Endereco::create($enderecoData);
                }

                // Criar preferências se fornecidas
                if (!empty($preferencias) && is_array($preferencias) && count(array_filter($preferencias, fn($v) => $v !== null && $v !== '')) > 0) {
                    $prefsData = $preferencias;
                    $prefsData['usuario_id'] = $usuario->id;
                    PreferenciaUsuario::create($prefsData);
                }

                $usuario->load(['endereco', 'preferencias']);

                return response()->json($usuario, 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Não foi possível criar o usuário',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exibir um usuário específico
     */
    public function show($id): JsonResponse
    {
        try {
            $usuario = Usuario::with(['endereco', 'preferencias'])->find($id);

            if (!$usuario) {
                return response()->json(['error' => 'Usuário não encontrado'], 404);
            }

            return response()->json($usuario, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível carregar o usuário'], 500);
        }
    }

    /**
     * Atualizar um usuário e seus relacionamentos
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $usuario = Usuario::find($id);

            if (!$usuario) {
                return response()->json(['error' => 'Usuário não encontrado'], 404);
            }

            $validator = Validator::make($request->all(), [
                'nome' => 'sometimes|required|string|min:2|max:150',
                'email' => [
                    'sometimes',
                    'required',
                    'email',
                    'max:150',
                    Rule::unique('usuarios')->ignore($usuario->id)
                ],
                'password' => [
                    'sometimes',
                    'required',
                    'string',
                    'min:8',
                    'confirmed',
                    'regex:/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/'
                ],
                'cpf' => [
                    'sometimes',
                    'required',
                    'string',
                    'size:11',
                    'regex:/^[0-9]+$/',
                    Rule::unique('usuarios')->ignore($usuario->id)
                ],
                'data_nascimento' => 'sometimes|required|date|before:today|after:1900-01-01',
                'telefone' => 'nullable|string|size:11|regex:/^[0-9]+$/',
                'role' => 'nullable|string|in:user,admin',

                // Validação da imagem no update
                'imagem' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:10240',

                'endereco' => 'nullable|array',
                'endereco.cep' => 'nullable|string|max:9',
                'endereco.logradouro' => 'nullable|string|max:255',
                'endereco.numero' => 'nullable|string|max:10',
                'endereco.complemento' => 'nullable|string|max:100',
                'endereco.bairro' => 'nullable|string|max:100',
                'endereco.cidade' => 'nullable|string|max:100',
                'endereco.uf' => 'nullable|string|max:2',

                // Validação das preferências conforme migration
                'preferencias' => 'nullable|array',
                'preferencias.tamanho_pet' => 'nullable|string|in:pequeno,medio,grande',
                'preferencias.tempo_disponivel' => 'nullable|string|in:pouco_tempo,tempo_moderado,muito_tempo',
                'preferencias.estilo_vida' => 'nullable|string|in:baixa,moderada,alta',
                'preferencias.espaco_casa' => 'nullable|string|in:area_pequena,area_media,area_externa',
            ], [
                'imagem.image' => 'O arquivo deve ser uma imagem.',
                'imagem.mimes' => 'A imagem deve ser do tipo: jpeg, jpg, png ou webp.',
                'imagem.max' => 'A imagem deve ter no máximo 10MB.',

                'preferencias.tamanho_pet.in' => 'O tamanho do pet deve ser: pequeno, medio ou grande.',
                'preferencias.tempo_disponivel.in' => 'O tempo disponível deve ser: pouco_tempo, tempo_moderado ou muito_tempo.',
                'preferencias.estilo_vida.in' => 'O estilo de vida deve ser: baixa, moderada ou alta.',
                'preferencias.espaco_casa.in' => 'O espaço da casa deve ser: area_pequena, area_media ou area_externa.',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $endereco = is_array($request->input('endereco')) ? $request->input('endereco') : [];
            $preferencias = is_array($request->input('preferencias')) ? $request->input('preferencias') : [];

            return DB::transaction(function () use ($request, $usuario, $endereco, $preferencias) {
                // Prepara dados do usuário
                $userData = $request->only([
                    'nome',
                    'email',
                    'cpf',
                    'data_nascimento',
                    'telefone',
                    'role'
                ]);

                // Hash da senha se fornecida
                if ($request->filled('password')) {
                    $userData['password'] = Hash::make($request->password);
                }

                // Processa upload de nova imagem
                if ($request->hasFile('imagem')) {
                    // Remove imagem antiga se existir
                    if ($usuario->imagem && Storage::disk('public')->exists($usuario->imagem)) {
                        Storage::disk('public')->delete($usuario->imagem);
                    }

                    // Faz upload da nova imagem
                    $imagem = $request->file('imagem');
                    $imagemNome = time() . '_' . uniqid() . '.' . $imagem->getClientOriginalExtension();
                    $userData['imagem'] = $imagem->storeAs('usuarios', $imagemNome, 'public');
                }

                // Atualiza o usuário
                $usuario->update($userData);

                // Atualiza ou cria endereço
                if (!empty($endereco) && is_array($endereco) && count(array_filter($endereco, fn($v) => $v !== null && $v !== '')) > 0) {
                    if ($usuario->endereco) {
                        $usuario->endereco->update($endereco);
                    } else {
                        $endereco['id_usuario'] = $usuario->id;
                        Endereco::create($endereco);
                    }
                }

                // Atualiza ou cria preferências
                if (!empty($preferencias) && is_array($preferencias) && count(array_filter($preferencias, fn($v) => $v !== null && $v !== '')) > 0) {
                    if ($usuario->preferencias) {
                        $usuario->preferencias->update($preferencias);
                    } else {
                        $preferencias['usuario_id'] = $usuario->id;
                        PreferenciaUsuario::create($preferencias);
                    }
                }

                return response()->json($usuario->fresh(['endereco', 'preferencias']), 200);
            });
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Não foi possível atualizar o usuário',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deletar um usuário (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        try {
            $usuario = Usuario::find($id);

            if (!$usuario) {
                return response()->json(['error' => 'Usuário não encontrado'], 404);
            }

            // Deleta a imagem ao excluir o usuário
            if ($usuario->imagem && Storage::disk('public')->exists($usuario->imagem)) {
                Storage::disk('public')->delete($usuario->imagem);
            }

            $usuario->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível excluir o usuário'], 500);
        }
    }

    /**
     * Restaurar um usuário deletado
     */
    public function restore($id): JsonResponse
    {
        try {
            $usuario = Usuario::withTrashed()->find($id);

            if (!$usuario) {
                return response()->json(['error' => 'Usuário não encontrado'], 404);
            }

            if (!$usuario->trashed()) {
                return response()->json(['error' => 'Usuário já está ativo'], 400);
            }

            $usuario->restore();

            return response()->json($usuario->load(['endereco', 'preferencias']), 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível restaurar o usuário'], 500);
        }
    }
}