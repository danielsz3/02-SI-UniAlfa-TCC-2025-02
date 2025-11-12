<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Relatório de Adoções</title>
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
    <h2>Relatório de Adoções</h2>

    <h3>Filtros Aplicados:</h3>
    <ul>
        @if(!empty($filtros['data_inicial']))<li><b>Data Inicial:</b> {{ \Carbon\Carbon::parse($filtros['data_inicial'])->format('d/m/Y') }}</li>@endif
        @if(!empty($filtros['data_final']))<li><b>Data Final:</b> {{ \Carbon\Carbon::parse($filtros['data_final'])->format('d/m/Y') }}</li>@endif
        @if(!empty($filtros['cidade']))<li><b>Cidade:</b> {{ $filtros['cidade'] }}</li>@endif
        @if(!empty($filtros['status']))<li><b>Status:</b> {{ ucfirst($filtros['status']) }}</li>@endif
    </ul>
    <hr>

    <table>
        <thead>
            <tr>
                <th>Animal</th>
                <th>Tipo</th>
                <th>Adotante</th>
                <th>Cidade</th>
                <th>Data Adoção</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($adocoes as $a)
                <tr>
                    <td>{{ $a->animal }}</td>
                    <td>{{ $a->tipo_animal ?? '-' }}</td>
                    <td>{{ $a->adotante }}</td>
                    <td>{{ $a->cidade ?? '-' }}</td>
                    <td>{{ \Carbon\Carbon::parse($a->data_adocao)->format('d/m/Y') }}</td>
                    <td>{{ ucfirst($a->status) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
