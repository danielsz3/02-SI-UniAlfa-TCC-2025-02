<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Animal;
use App\Models\Adocao;
use App\Models\Evento;
use App\Models\Transacao;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $start = $request->query('start_date')
            ? Carbon::parse($request->query('start_date'))->startOfDay()
            : now()->subMonth()->startOfDay();

        $end = $request->query('end_date')
            ? Carbon::parse($request->query('end_date'))->endOfDay()
            : now()->endOfDay();

        $usuarios = Usuario::where('role', 'user')->count();

        $novosUsuarios = Usuario::whereBetween('created_at', [$start, $end])->count();

        $adocoesTotal = Adocao::count();

        $adocoesConcluidas = Adocao::whereBetween('created_at', [$start, $end])->where('status', 'aprovado')->count();
        $adocoesEmAberto   = Adocao::whereBetween('created_at', [$start, $end])->where('status', 'em_aprovacao')->count();
        $adocoesNegadas    = Adocao::whereBetween('created_at', [$start, $end])->where('status', 'negado')->count();

        $adocoesPeriodo = Adocao::whereBetween('created_at', [$start, $end])->count();
        $taxaConversao = Usuario::count() > 0
            ? round(($adocoesConcluidas / Usuario::count()) * 100, 2)
            : 0;

        $totalAnimais = Animal::count();
        $disponiveis = Animal::where('situacao', 'disponivel')->count();
        $adotados = Animal::where('situacao', 'adotado')->count();
        $emAdocao = Animal::where('situacao', 'em_adocao')->count();

        $castrados = Animal::where('castrado', true)->count();
        $naoCastrados = $totalAnimais - $castrados;

        $eventosPeriodo = Evento::whereBetween('data_fim', [$start, $end])->count();

        $adocoesAntes = Adocao::whereBetween('created_at', [$start->copy()->subMonth(), $start])->count();
        $impactoAdocoes = $adocoesAntes > 0
            ? round((($adocoesPeriodo - $adocoesAntes) / $adocoesAntes) * 100, 2)
            : 0;

        return response()->json([
            'periodo' => [
                'inicio' => $start->toDateString(),
                'fim' => $end->toDateString(),
            ],
            'usuarios' => [
                'ativos' => $usuarios,
                'novos' => $novosUsuarios,
                'taxa_conversao' => $taxaConversao,
            ],
            'animais' => [
                'total' => $totalAnimais,
                'disponiveis' => $disponiveis,
                'adotados' => $adotados,
                'em_adocao' => $emAdocao,
                'castrados' => $castrados,
                'nao_castrados' => $naoCastrados,
            ],
            'adocoes' => [
                'total' => $adocoesTotal,
                'concluidas' => $adocoesConcluidas,
                'em_aberto' => $adocoesEmAberto,
                'negadas' => $adocoesNegadas,
                'no_periodo' => $adocoesPeriodo,
            ],
            'eventos' => [
                'total' => $eventosPeriodo,
                'impacto_adocoes_percentual' => $impactoAdocoes,
            ],
        ]);
    }

    public function transacoes(Request $request)
    {
        $start = $request->query('start_date')
            ? Carbon::parse($request->query('start_date'))->startOfDay()
            : now()->subMonth()->startOfDay();

        $end = $request->query('end_date')
            ? Carbon::parse($request->query('end_date'))->endOfDay()
            : now()->endOfDay();

        $transacoes = Transacao::whereBetween('data', [$start, $end])->get();

        return response()->json($transacoes);
    }
}
