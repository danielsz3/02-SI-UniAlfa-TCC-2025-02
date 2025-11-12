<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Relatório de Usuários</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        h2 { text-align: center; margin-bottom: 10px; }
        h3 { margin-top: 20px; }
        ul { list-style: none; padding: 0; margin: 0 0 10px 0; }
        li { margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #999; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h2>Relatório de Usuários</h2>

    <h3>Filtros Aplicados:</h3>
    <ul>
        @if(!empty($filtros['data_inicial']))<li><b>Data Inicial:</b> {{ \Carbon\Carbon::parse($filtros['data_inicial'])->format('d/m/Y') }}</li>@endif
        @if(!empty($filtros['data_final']))<li><b>Data Final:</b> {{ \Carbon\Carbon::parse($filtros['data_final'])->format('d/m/Y') }}</li>@endif
        @if(!empty($filtros['cidade']))<li><b>Cidade:</b> {{ $filtros['cidade'] }}</li>@endif
        @if(!empty($filtros['role']))<li><b>Função:</b> {{ ucfirst($filtros['role']) }}</li>@endif
    </ul>
    <hr>

    <table>
        <thead>
            <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Função</th>
                <th>Cidade</th>
                <th>Estado</th>
                <th>Data de Cadastro</th>
            </tr>
        </thead>
        <tbody>
            @foreach($usuarios as $u)
                <tr>
                    <td>{{ $u->nome }}</td>
                    <td>{{ $u->email }}</td>
                    <td>{{ ucfirst($u->role ?? '-') }}</td>
                    <td>{{ $u->cidade ?? '-' }}</td>
                    <td>{{ $u->uf ?? '-' }}</td>
                    <td>{{ \Carbon\Carbon::parse($u->created_at)->format('d/m/Y') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
