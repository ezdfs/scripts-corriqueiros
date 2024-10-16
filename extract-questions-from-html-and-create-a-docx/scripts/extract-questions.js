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
let question = []

// Number of question
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

// Calls the function
recursion(divContainer)

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