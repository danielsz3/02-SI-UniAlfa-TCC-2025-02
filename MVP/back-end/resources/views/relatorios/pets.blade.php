<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Relatório de Pets</title>
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
    <h2>Relatório de Pets</h2>

    <h3>Filtros Aplicados:</h3>
    <ul>
        @if(!empty($filtros['data_inicial']))<li><b>Data Inicial:</b> {{ \Carbon\Carbon::parse($filtros['data_inicial'])->format('d/m/Y') }}</li>@endif
        @if(!empty($filtros['data_final']))<li><b>Data Final:</b> {{ \Carbon\Carbon::parse($filtros['data_final'])->format('d/m/Y') }}</li>@endif
        @if(!empty($filtros['tipo_animal']))<li><b>Tipo:</b> {{ ucfirst($filtros['tipo_animal']) }}</li>@endif
        @if(!empty($filtros['status']))<li><b>Status:</b> {{ ucfirst($filtros['status']) }}</li>@endif
    </ul>
    <hr>

    <table>
        <thead>
            <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Tamanho</th>
                <th>Nível de Energia</th>
                <th>Data Cadastro</th>
                <th>Data Adoção</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pets as $p)
                <tr>
                    <td>{{ $p->nome }}</td>
                    <td>{{ $p->tipo_animal }}</td>
                    <td>{{ ucfirst($p->tamanho ?? '-') }}</td>
                    <td>{{ ucfirst($p->nivel_energia ?? '-') }}</td>
                    <td>{{ \Carbon\Carbon::parse($p->data_cadastro)->format('d/m/Y') }}</td>
                    <td>{{ $p->data_adocao ? \Carbon\Carbon::parse($p->data_adocao)->format('d/m/Y') : '-' }}</td>
                    <td>{{ $p->status }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
