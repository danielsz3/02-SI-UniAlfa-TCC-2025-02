@php
    $backgroundColor = '#f0f4ff'; 
    $buttonColor = '#1976d2'; 
    $buttonHoverColor = '#1565c0'; 
    $textColor = '#0d47a1'; 
@endphp

<table style="width: 100%; background-color: {{ $backgroundColor }}; padding: 20px 0; font-family: Arial, sans-serif;">
    <tr>
        <td align="center">
            <table style="width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <tr>
                    <td style="padding: 20px; text-align: center; background-color: #ffffff;">
                        <h1 style="color: {{ $textColor }}; margin: 0; font-size: 28px; font-weight: bold;">
                            @if (! empty($greeting))
                                {{ $greeting }}
                            @else
                                @if ($level === 'error')
                                    Whoops!
                                @else
                                    Hello!
                                @endif
                            @endif
                        </h1>
                    </td>
                </tr>

                <tr>
                    <td style="padding: 30px; color: {{ $textColor }}; font-size: 16px; line-height: 1.5;">
                        @foreach ($introLines as $line)
                            <p style="margin: 0 0 15px;">{{ $line }}</p>
                        @endforeach

                        @isset($actionText)
                            <p style="text-align: center; margin: 30px 0;">
                                <a href="{{ $actionUrl }}" 
                                   style="
                                        background-color: {{ $buttonColor }};
                                        color: #fff;
                                        padding: 12px 24px;
                                        text-decoration: none;
                                        border-radius: 6px;
                                        font-weight: bold;
                                        display: inline-block;
                                        transition: background-color 0.3s ease;
                                    "
                                   onmouseover="this.style.backgroundColor='{{ $buttonHoverColor }}';"
                                   onmouseout="this.style.backgroundColor='{{ $buttonColor }}';"
                                >
                                    {{ $actionText }}
                                </a>
                            </p>
                        @endisset

                        @foreach ($outroLines as $line)
                            <p style="margin: 0 0 15px;">{{ $line }}</p>
                        @endforeach
                        <p style="margin-top: 30px;">
                            @if (! empty($salutation))
                                {{ $salutation }}
                            @else
                                Regards,<br>
                                {{ config('app.name') }}
                            @endif
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #999999;">
                        &copy; {{ date('Y') }}. Todos os Direitos Reservados.
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>