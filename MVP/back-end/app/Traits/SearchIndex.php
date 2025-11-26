<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Throwable;

trait SearchIndex
{
    protected function SearchIndex(
        Request $request,
        Builder $query,
        string $resourceName = 'items',
        array $likeFields = []
    ): JsonResponse {
        try {
            $range = json_decode($request->query('range', '[0,9]'), true);
            $start = $range[0] ?? 0;
            $end   = $range[1] ?? 9;
            $perPage = ($end - $start + 1);
            $page    = intval($start / $perPage) + 1;

            $sortParam = json_decode($request->query('sort', '["id","ASC"]'), true);
            $sort  = $sortParam[0] ?? 'id';
            $order = $sortParam[1] ?? 'ASC';

            $filters = json_decode($request->query('filter', '{}'), true);

            foreach ($filters as $field => $value) {
                if ($value === null || $value === '') continue;

                if (preg_match('/(.+)_from$/', $field, $matches)) {
                    $query->where($matches[1], '>=', $value);
                    continue;
                }
                if (preg_match('/(.+)_to$/', $field, $matches)) {
                    $query->where($matches[1], '<=', $value);
                    continue;
                }

                if (in_array($field, $likeFields)) {
                    $query->where($field, 'like', '%' . $value . '%');
                } else {
                    $query->where($field, $value);
                }
            }

            $query->orderBy($sort, $order);

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return response()
                ->json($paginator->items())
                ->header('Content-Range', "{$resourceName} {$start}-{$end}/{$paginator->total()}")
                ->header('Access-Control-Expose-Headers', 'Content-Range');
        } catch (Throwable $e) {
            return response()->json([
                'error' => 'Erro ao listar ' . $resourceName,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
