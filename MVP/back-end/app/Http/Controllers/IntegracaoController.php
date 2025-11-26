<?php

namespace App\Http\Controllers;

use App\Models\Integracao;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class IntegracaoController extends Controller
{
    use SearchIndex;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        return $this->SearchIndex(
            $request,
            Integracao::query(),
            'integracoes',
            ['service']
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'service'      => 'required|string|max:255',
            'username'     => 'required|string|max:255',
            'access_token' => 'required|string',
            'user_id'      => 'required|string|max:255',
            'status'       => 'required|in:ativo,inativo',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $data = [
                'service'      => $request->service,
                'username'     => $request->username,
                'access_token' => $request->access_token,
                'user_id'      => $request->user_id,
                'status'       => $request->status,
            ];

            $integracao = Integracao::update($data);

            return response()->json($integracao, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível editar a integração'], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
