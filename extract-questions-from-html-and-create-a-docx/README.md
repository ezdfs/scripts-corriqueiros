# Script utilitário para extrair questões
## Linguagens
- Javascript🟨🟦⬜
- Python 🐍
  
## Descrição
Estava precisando de umas questões para estudar, mas a opção de baixar como pdf era paga e um pouquinho caro. Porém como as questões são gratuitas, eu tinha a opção de copiar uma a uma e ir criando um docx, mas isso é chato e demorado. Então decidir só copiar a árvore html, criar um script que extrae as questões, extrair as questões e criar um docx de forma automática para mais tarde criar meu próprio pdf e ser feliz economizando meu dindin.<br><br>

Fique a vontade para adaptar e usar se quiser em algo semelhante :)<br>
Mas atenção, esse script é corriqueiro e não foi testado e nem tratado os erros.

## Como isso funciona 🔧
### Javascript🟨🟦⬜
Ele é bem simples, primeiro criamos o DOM usando jsDOM:
```javascript
import { JSDOM } from 'jsdom';
import fs from 'node:fs'

// Create a virtual DOM
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { document } = window;
```
Depois criamos uma div container para ponto de referência do html que será percorrido, usamos fs do nodejs para ler nosso arquivo de texto que contém o html e retorná-lo como uma string. Repare que o mesmo se encontra dentro da pasta `input files`.<br>
Por fim, criamos um array para as questões(que guarda os textos e as alternativas), um array para a questão e uma constante para o número da questão.
```javascript
// Create a container that receives the html
let divContainer = document.createElement('div');

// Read the html file txt and set it as a string
divContainer.innerHTML = fs.readFileSync('./input files/html.txt', 'utf-8')

// Array of questions
let questionsArr = []

// Question components as array
let question = []

// Number of question
let questionNumber = 0
```
Aí percorremos o html recursivamente, aqui obtemos os textos e as alternativas da questão do html. Repare que as condições foram específicas para o meu contexto baseado nos padrões que encontrei, podendo ser diferente dependendo de onde as questões forem retiradas.
```javascript
// Recursive function to find all children
function recursion(element) {
    element.childNodes.forEach(child => {
        if (child.nodeType === 3) { // If is a text(nodeType 3)
            const text = child.textContent.trim()

            if (text !== '') {
                if (text.includes('Question #')) { // Standard to my context
                    questionNumber++
                }
                
                // When a new question is current
                if (text === `Question #${questionNumber}`) {
                    if (question.length > 0) {
                        // Question are ready and is put in the questions array
                        questionsArr.push(question)

                        // Ready to create a new question
                        question = []
                        question.push(text)
                    } else {
                        // Building question
                        question.push(text)
                    }
                } else {
                    // Text that is not required are avoid
                    if (text !== 'Most Voted' && text !== 'Topic 1') {
                        question.push(text)
                    }
                }
            }
        } else {
            // Tag that is not necessary are avoid
            if (`${child.tagName}` !== 'A' && `${child.tagName}` !== 'SCRIPT' && `${child.tagName}` !== 'undefined' && `${child.tagName}` !== 'BR') {
                recursion(child); // Call recursively the children of child
            }
        }
    });
}
```
Por fim chamamos a função que extrai tudo para a gente:
```javascript
// Call the function
recursion(divContainer);
```
Um detalhe é que a última questão, devido a estrutura do código, fica de fora, mesmo sendo processada, não é possível adicioná-la ao array. Por conta disso, adicionei o seguinte trecho após chamar a função.
```javascript
// The last question that is not added on array
if (question.length > 0) {
    questionsArr.push(question)
}
```
Agora criamos duas variáveis, uma para as questões e outra para as respostas das questões.
```javascript
// All questions as a string
let questionsAsAString = ''

// All answers as a string
let answerAsAString = ''
```
Percorremos cada questão e montamos as questões e as respostas. Repare que as marcações adicionadas `[heading]`, `[text]`, `[alternative]`, `[answer]`, indica a estrutura que será montada nosso docx.
```javascript
// Building txt
questionsArr.forEach(question => {
    // Generic texts
    let texts = []

    // Var to stop of getting the text
    let stop = false

    // Building the question in the txt
    for (let index = 0; index < question.length; index++) {
        const text = question[index];

        // "Question #" mean the init of a question
        if (text.includes('Question #')) {
            if (questionsAsAString === '') {
                questionsAsAString = text + ' [heading]'
            } else {
                questionsAsAString = questionsAsAString + '\n\n' + text + ' [heading]'
            }
        }

        // Get all texts between "Question #" and the alternatives of question, that text is enunciante and ask
        if (stop === false && text !== 'A.' && !text.includes('Question #')) {
            texts.push(text)
            questionsAsAString = questionsAsAString + '\n' + text + ' [text]' + '\n'
        }

        // That is the prefix of alternative and the next is the sufix or answer of alternative
        if (text === 'A.' || text === 'B.' || text === 'C.' || text === 'D.' || text === 'E.') {
            stop = true
            questionsAsAString = questionsAsAString + '\n' + text + ' ' + question[index + 1] + ' [alternative]'
        }

        // Right answer
        if (text === 'Correct Answer:') {
            answerAsAString = answerAsAString + '\n' + question[0] + ': ' + question[index + 1] + ' [answer]'
        }
        
    }
});
```
Por fim, apenas criamos um arquivo texto que será lido pelo nosso script em python. Repare que o arquivo gerado foi colocado dentro da pasta `tmp output files` e as respostas foram colocadas ao final do arquivo txt.
```javascript
// This creates if not exists a file called "example.txt" and writes the questions into it
fs.writeFile('./tmp output files/example.txt', questionsAsAString + '\n\n' + 'Answer sheet:(Aqui abaixo ficam as respostas) [heading]\n' + answerAsAString, (err) => {
    if (err) throw err;
    console.log('Txt created successfully!');
});
```
### Python 🐍
Em python, iremos usar o python-docx para criar nossos documentos. Primeiro, importamos nossas dependências e abrimos o arquivo txt criado anteriormente e extraímos as linhas.
```python
from docx import Document
from docx.shared import Pt, RGBColor

# Open and get the lines of example.txt
file = open('./tmp output files/example.txt')
lines = file.readlines()
```
Logo após, criamos nosso arquivo docx e adicionamos um título nele.
```python
# Create the docx file and writes the title into it
document = Document()
title = document.add_heading('Aqui está o docx', level=0)
title.runs[0].font.size = Pt(18)  # Font size
title.runs[0].font.bold = True  # Bold style
title.runs[0].font.color.rgb = RGBColor(0, 102, 204)  # Font color
```
Percorremos as linhas com um for e com base na marcação colocada anteriormente em cada linha no código js, construímos nosso docx com os estilos e formatações desejadas.
```python
# Read each line of example.txt
for line in lines:
    # '[title]' is a mark to heading
    if '[heading]' in line:
        heading = line.replace('[heading]', '').strip()
        heading = document.add_heading(heading, level=1)  # Add heading
        heading.runs[0].font.size = Pt(16)
        heading.runs[0].font.bold = True
        heading.runs[0].font.color.rgb = RGBColor(0, 102, 204)

    # '[text]' is a mark to enunciate and asks
    if '[text]' in line:
        text = line.replace('[text]', '').strip()        
        paragraph = document.add_paragraph(text)  # Add a paragraph
        for run in paragraph.runs:
            run.font.size = Pt(12)
            run.font.name = 'Arial'
            run.font.color.rgb = RGBColor(0, 0, 0)

    # '[alternative]' is a mark to alternatives(A, B, C, D or E)
    if '[alternative]' in line:
        alternative = line.replace('[alternative]', '').strip()
        alternative = alternative.replace('.', ')')  # Switch . to ) because I like more of )
        paragraph = document.add_paragraph(alternative)  # Add a paragraph for alternative
        paragraph.style = 'List'  # List style
        
        for run in paragraph.runs:
            run.font.size = Pt(12)
            run.font.name = 'Arial'
            run.font.color.rgb = RGBColor(0, 0, 0)

    # Answers for questions
    if '[answer]' in line:        
        answer = line.replace('[answer]', '')
        
        paragraph = document.add_paragraph(answer)
        paragraph.style = 'List'

        for run in paragraph.runs:
            run.font.size = Pt(12)
            run.font.name = 'Arial' 
            run.font.color.rgb = RGBColor(0, 0, 0)

```
Por fim apenas salvamos nosso docx.
```python
# Save the docx
document.save('./output files/example.docx')
print('Docx created successfully!')
```
### Scripts 🧑🏿‍💻
Para deixarmos nossa vida mais fácil, apenas criamos um script em nosso package.json que roda primeiro o script js que extrae as questões e depois o script python que cria o docx.
```json
{
  "scripts": {
    "create": "node scripts/extract-questions.js && python scripts/create-docx.py"
  }
}
```
## Código completo
### Javascript🟨🟦⬜
```javascript
import { JSDOM } from 'jsdom';
import fs from 'node:fs'

// Create a virtual DOM
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { document } = window;

// Create a container that receives the html
let divContainer = document.createElement('div');

// Read the html file txt and set it as a string
divContainer.innerHTML = fs.readFileSync('./input files/html.txt', 'utf-8')

// Array of questions
let questionsArr = []

// Question components as array
const question = []

// Number of first question
let questionNumber = 0

// Recursive function to find all children
function recursion(element) {
    element.childNodes.forEach(child => {
        if (child.nodeType === 3) { // If is a text(nodeType 3)
            const text = child.textContent.trim()

            if (text !== '') {
                if (text.includes('Question #')) { // Standard to my context
                    questionNumber++
                }
                
                // When a new question is current
                if (text === `Question #${questionNumber}`) {
                    if (question.length > 0) {
                        // Question are ready and is put in the questions array
                        questionsArr.push(question)

                        // Ready to create a new question
                        question = []
                        question.push(text)
                    } else {
                        // Building question
                        question.push(text)
                    }
                } else {
                    // Text that is not required are avoid
                    if (text !== 'Most Voted' && text !== 'Topic 1') {
                        question.push(text)
                    }
                }
            }
        } else {
            // Tag that is not necessary are avoid
            if (`${child.tagName}` !== 'A' && `${child.tagName}` !== 'SCRIPT' && `${child.tagName}` !== 'undefined' && `${child.tagName}` !== 'BR') {
                recursion(child); // Call recursively the children of child
            }
        }
    });
}

// Call the function
recursion(divContainer);

// The last question that is not added on array
if (question.length > 0) {
    questionsArr.push(question)
}

// All questions as a string
let questionsAsAString = ''

// All answers as a string
let answerAsAString = ''

// Building txt
questionsArr.forEach(question => {
    // Generic texts
    let texts = []

    // Var to stop of getting the text
    let stop = false

    // Building the question in the txt
    for (let index = 0; index < question.length; index++) {
        const text = question[index];

        // "Question #" mean the init of a question
        if (text.includes('Question #')) {
            if (questionsAsAString === '') {
                questionsAsAString = text + ' [heading]'
            } else {
                questionsAsAString = questionsAsAString + '\n\n' + text + ' [heading]'
            }
        }

        // Get all texts between "Question #" and the alternatives of question, that text is enunciante and ask
        if (stop === false && text !== 'A.' && !text.includes('Question #')) {
            texts.push(text)
            questionsAsAString = questionsAsAString + '\n' + text + ' [text]' + '\n'
        }

        // That is the prefix of alternative and the next is the sufix or answer of alternative
        if (text === 'A.' || text === 'B.' || text === 'C.' || text === 'D.' || text === 'E.') {
            stop = true
            questionsAsAString = questionsAsAString + '\n' + text + ' ' + question[index + 1] + ' [alternative]'
        }

        // Right answer
        if (text === 'Correct Answer:') {
            answerAsAString = answerAsAString + '\n' + question[0] + ': ' + question[index + 1] + ' [answer]'
        }
        
    }
});

// This creates if not exists a file called "example.txt" and writes the questions into it
fs.writeFile('./tmp output files/example.txt', questionsAsAString + '\n\n' + 'Answer sheet:(Aqui abaixo ficam as respostas) [heading]\n' + answerAsAString, (err) => {
    if (err) throw err;
    console.log('Txt created successfully!');
});
```
### Python 🐍
```python
from docx import Document
from docx.shared import Pt, RGBColor

# Open and get the lines of example.txt
file = open('./tmp output files/example.txt')
lines = file.readlines()

# Create the docx file and writes the title into it
document = Document()
title = document.add_heading('Aqui está o docx', level=0)
title.runs[0].font.size = Pt(18)  # Font size
title.runs[0].font.bold = True  # Bold style
title.runs[0].font.color.rgb = RGBColor(0, 102, 204)  # Font color

# Read each line of example.txt
for line in lines:
    # '[title]' is a mark to heading
    if '[heading]' in line:
        heading = line.replace('[heading]', '').strip()
        heading = document.add_heading(heading, level=1)  # Add heading
        heading.runs[0].font.size = Pt(16)
        heading.runs[0].font.bold = True
        heading.runs[0].font.color.rgb = RGBColor(0, 102, 204)

    # '[text]' is a mark to enunciate and asks
    if '[text]' in line:
        text = line.replace('[text]', '').strip()        
        paragraph = document.add_paragraph(text)  # Add a paragraph
        for run in paragraph.runs:
            run.font.size = Pt(12)
            run.font.name = 'Arial'
            run.font.color.rgb = RGBColor(0, 0, 0)

    # '[alternative]' is a mark to alternatives(A, B, C, D or E)
    if '[alternative]' in line:
        alternative = line.replace('[alternative]', '').strip()
        alternative = alternative.replace('.', ')')  # Switch . to ) because I like more of )
        paragraph = document.add_paragraph(alternative)  # Add a paragraph for alternative
        paragraph.style = 'List'  # List style
        
        for run in paragraph.runs:
            run.font.size = Pt(12)
            run.font.name = 'Arial'
            run.font.color.rgb = RGBColor(0, 0, 0)

    # Answers for questions
    if '[answer]' in line:        
        answer = line.replace('[answer]', '')
        
        paragraph = document.add_paragraph(answer)
        paragraph.style = 'List'

        for run in paragraph.runs:
            run.font.size = Pt(12)
            run.font.name = 'Arial' 
            run.font.color.rgb = RGBColor(0, 0, 0)

# Save the docx
document.save('./output files/example.docx')
print('Docx created successfully!')
```
### Pastas 📂
`input files`: pasta para os arquivos de texto que contém o html<br>
`tmp output files`: pasta onde o arquivo de texto que o código python vai ler é salvo<br>
`output files`: pasta onde os docx criados são salvos<br>
`scripts`: pasta onde os scripts estão<br>
