<!-- <?php

// namespace App\Http\Controllers;

// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\DB;
// use PDF;

// class RelatorioController extends Controller
// {
//     // ====================================================
//     // 1️⃣ RELATÓRIO DE ADOÇÕES COM FILTROS
//     // ====================================================
//     public function adocoes(Request $request)
//     {
//         $query = DB::table('adocoes')
//             ->join('animais', 'adocoes.animal_id', '=', 'animais.id')
//             ->join('usuarios', 'adocoes.usuario_id', '=', 'usuarios.id')
//             ->leftJoin('enderecos', 'enderecos.id_usuario', '=', 'usuarios.id')
//             ->select(
//                 'animais.nome as animal',
//                 'animais.tipo_animal',
//                 'usuarios.nome as adotante',
//                 'enderecos.cidade',
//                 'adocoes.created_at as data_adocao',
//                 'adocoes.status'
//             );

//         // ====== FILTROS ======
//         if ($request->filled('data_inicial') && $request->filled('data_final')) {
//             $query->whereBetween(DB::raw('DATE(adocoes.created_at)'), [$request->data_inicial, $request->data_final]);
//         }

//         if ($request->filled('cidade')) {
//             $query->where('enderecos.cidade', 'like', '%' . $request->cidade . '%');
//         }

//         if ($request->filled('status')) {
//             $query->where('adocoes.status', $request->status);
//         }

//         $adocoes = $query->orderBy('adocoes.created_at', 'desc')->get();

//         $pdf = PDF::loadView('relatorios.adocoes', [
//             'adocoes' => $adocoes,
//             'filtros' => $request->all()
//         ])->setPaper('a4', 'portrait');

//         return $pdf->stream('relatorio_adocoes.pdf');
//     }

//     // ====================================================
//     // 2️⃣ RELATÓRIO DE USUÁRIOS COM FILTROS
//     // ====================================================
//     public function usuarios(Request $request)
//     {
//         $query = DB::table('usuarios')
//             ->leftJoin('enderecos', 'enderecos.id_usuario', '=', 'usuarios.id')
//             ->select(
//                 'usuarios.nome',
//                 'usuarios.email',
//                 'usuarios.role',
//                 'usuarios.created_at',
//                 'enderecos.cidade',
//                 'enderecos.uf'
//             );

//         // ====== FILTROS ======
//         if ($request->filled('role')) {
//             $query->where('usuarios.role', $request->role);
//         }

//         if ($request->filled('cidade')) {
//             $query->where('enderecos.cidade', 'like', '%' . $request->cidade . '%');
//         }

//         if ($request->filled('data_inicial') && $request->filled('data_final')) {
//             $query->whereBetween(DB::raw('DATE(usuarios.created_at)'), [$request->data_inicial, $request->data_final]);
//         }

//         $usuarios = $query->orderBy('usuarios.created_at', 'desc')->get();

//         $pdf = PDF::loadView('relatorios.usuarios', [
//             'usuarios' => $usuarios,
//             'filtros' => $request->all()
//         ])->setPaper('a4', 'portrait');

//         return $pdf->stream('relatorio_usuarios.pdf');
//     }

//     // ====================================================
//     // 3️⃣ RELATÓRIO DE PETS COM FILTROS
//     // ====================================================
//     public function pets(Request $request)
//     {
//         $query = DB::table('animais')
//             ->leftJoin('adocoes', 'animais.id', '=', 'adocoes.animal_id')
//             ->select(
//                 'animais.nome',
//                 'animais.tipo_animal',
//                 'animais.tamanho',
//                 'animais.nivel_energia',
//                 'animais.situacao',
//                 'animais.created_at as data_cadastro',
//                 'adocoes.created_at as data_adocao',
//                 DB::raw("CASE
//             WHEN adocoes.status = 'aprovado' THEN 'Adotado'
//             ELSE 'Disponível'
//          END as status")
//             );

//         // ====== FILTROS ======
//         if ($request->filled('tipo_animal')) {
//             $query->where('animais.tipo_animal', $request->tipo_animal);
//         }

//        if ($request->status === 'Adotado') {
//     $query->where('adocoes.status', 'aprovado');
// } elseif ($request->status === 'Disponível') {
//     $query->whereNull('adocoes.id')
//           ->orWhere('adocoes.status', '!=', 'aprovado');
// }

//         if ($request->filled('data_inicial') && $request->filled('data_final')) {
//             $query->whereBetween(DB::raw('DATE(animais.created_at)'), [$request->data_inicial, $request->data_final]);
//         }

//         $pets = $query->orderBy('animais.created_at', 'desc')->get();

//         $pdf = PDF::loadView('relatorios.pets', [
//             'pets' => $pets,
//             'filtros' => $request->all()
//         ])->setPaper('a4', 'portrait');

//         return $pdf->stream('relatorio_pets.pdf');
//     }
// }
