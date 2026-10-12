# FORM — Calculadora

Uma calculadora web responsiva, com tema claro/escuro, histórico persistente e suporte completo a teclado.

## Como usar

1. Mantenha os três arquivos na mesma pasta:
   - `index.html`
   - `style.css`
   - `script.js`
2. Abra o arquivo `index.html` no navegador.

Não é necessário instalar dependências, executar comandos ou configurar servidor.

## Recursos

- Operações de adição, subtração, multiplicação e divisão
- Respeita a prioridade de `×` e `÷` nas expressões
- Porcentagem e inversão de sinal (`±`)
- Botão para apagar o último caractere e botão `AC` para limpar
- Histórico dos últimos 50 cálculos
- Reutilização de resultados do histórico com um clique
- Agrupamento do histórico por data: Hoje, Ontem ou data completa
- Tema claro/escuro salvo automaticamente
- Menu com ajuda rápida de teclado
- Interface responsiva para computador, tablet e celular
- Estrutura acessível com rótulos e foco visível no teclado

## Atalhos de teclado

| Tecla | Ação |
| --- | --- |
| `0` a `9` | Digita números |
| `+`, `-`, `*`, `/` | Insere operações |
| `.` ou `,` | Insere separador decimal |
| `Enter` ou `=` | Calcula o resultado |
| `Backspace` | Apaga o último caractere |
| `Esc` ou `Delete` | Limpa a calculadora |
| `%` | Aplica porcentagem |

## Persistência de dados

O projeto utiliza o `localStorage` do navegador para salvar:

- Histórico de cálculos, na chave `formCalculatorHistory`;
- Preferência de tema, na chave `formCalculatorSettings`.

Por isso, não é necessário criar um arquivo `data.json`. Os dados ficam no navegador usado para abrir a calculadora e podem ser removidos ao limpar os dados de navegação.

## Estrutura dos arquivos

```text
.
├── index.html   # Estrutura e conteúdo da página
├── style.css    # Estilos, temas e responsividade
├── script.js    # Cálculos, histórico, teclado e persistência
└── README.md    # Documentação do projeto
```

## Tecnologias

- HTML5
- CSS3
- JavaScript (sem bibliotecas externas)
- Google Fonts: Inter

## Observação

A calculadora foi feita para uso local no navegador. Para publicar na internet, basta enviar esses arquivos para um serviço de hospedagem estática.
