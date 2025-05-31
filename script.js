document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const textInput = document.getElementById('textInput');
    const loadButton = document.getElementById('loadButton');
    const meaningDisplay = document.getElementById('meaningDisplay');
    const wordInput = document.getElementById('wordInput');
    const feedbackDisplay = document.getElementById('feedbackDisplay');
    const nextButton = document.getElementById('nextButton');
    const shuffleButton = document.getElementById('shuffleButton');
    const retryButton = document.getElementById('retryButton'); // Added
    const correctCountDisplay = document.getElementById('correctCount');
    const incorrectCountDisplay = document.getElementById('incorrectCount'); // Added
    const reviewList = document.getElementById('reviewList');
    const startReviewButton = document.getElementById('startReviewButton'); // Added

    const quizArea = document.querySelector('.quiz-area');
    const controlsArea = document.querySelector('.controls-area'); // Added
    const progressArea = document.querySelector('.progress-area'); // Added
    const reviewArea = document.querySelector('.review-area'); // Added

    // App State
    let wordList = [];
    let currentWordIndex = -1;
    let originalWordList = []; // For retrying without re-parsing
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let incorrectWords = []; // For review
    let isReviewing = false; // Flag for review mode

    // --- 1. TSV Data Loading and Parsing ---
    loadButton.addEventListener('click', loadData);
    fileInput.addEventListener('change', handleFileUpload);

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                textInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    }

    function loadData() {
        const data = textInput.value.trim();
        if (!data) {
            alert('単語リストを入力またはアップロードしてください。');
            return;
        }
        parseTSV(data);
        if (wordList.length > 0) {
            originalWordList = [...wordList]; // Store the original list
            resetQuizState();
            displayNextWord();
            quizArea.style.display = 'block';
            controlsArea.style.display = 'block';
            progressArea.style.display = 'block';
            reviewArea.style.display = 'none'; // Hide review area initially
            document.querySelector('.input-area').style.display = 'none'; // Hide input area
        } else {
            alert('有効な単語データが見つかりませんでした。TSV形式 (単語\t意味) で入力してください。');
        }
    }

    function parseTSV(tsvData) {
        wordList = tsvData
            .split('\n')
            .map(line => {
                const parts = line.split('\t');
                if (parts.length === 2 && parts[0].trim() !== '' && parts[1].trim() !== '') {
                    return { word: parts[0].trim(), meaning: parts[1].trim() };
                }
                return null;
            })
            .filter(item => item !== null);
    }

    function resetQuizState() {
        currentWordIndex = -1;
        correctAnswers = 0;
        incorrectAnswers = 0;
        incorrectWords = [];
        isReviewing = false;
        updateProgressDisplay();
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = '';
        wordInput.value = '';
        wordInput.classList.remove('incorrect-input');
        nextButton.style.display = 'none';
        reviewList.innerHTML = ''; // Clear review list
        startReviewButton.style.display = 'none';
    }

    // --- 2. Displaying Words ---
    function displayNextWord() {
        wordInput.value = '';
        wordInput.classList.remove('incorrect-input');
        wordInput.disabled = false;
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = '';
        nextButton.style.display = 'none';

        if (isReviewing) {
            if (incorrectWords.length > 0) {
                currentWordIndex = 0; // Always take the first from the review list
                meaningDisplay.textContent = incorrectWords[currentWordIndex].meaning;
            } else {
                endReviewSession();
                return;
            }
        } else {
            if (wordList.length === 0) {
                showCompletionMessage();
                return;
            }
            // Get a random index from the remaining words
            currentWordIndex = Math.floor(Math.random() * wordList.length);
            meaningDisplay.textContent = wordList[currentWordIndex].meaning;
        }
    }

    function showCompletionMessage() {
        meaningDisplay.textContent = 'すべての単語の練習が終わりました！';
        wordInput.style.display = 'none';
        nextButton.style.display = 'none';
        if (incorrectWords.length > 0) {
            reviewArea.style.display = 'block';
            startReviewButton.style.display = 'inline-block';
            populateReviewList();
        } else {
            feedbackDisplay.textContent = '全問正解です！素晴らしい！';
            feedbackDisplay.className = 'feedback-correct';
        }
    }

    // Placeholder for other functions (to be implemented in next steps)
    // --- 3. User Input Check ---
    // --- 4. Feedback Display ---
    // --- 5. Next Word Logic --- (Partially in displayNextWord)
    // --- 6. Shuffle Words ---
    // --- 7. Progress Tracking --- (Partially in resetQuizState and updateProgressDisplay)
    // --- 8. Review Incorrect Words ---

    function updateProgressDisplay() {
        correctCountDisplay.textContent = correctAnswers;
        incorrectCountDisplay.textContent = incorrectAnswers;
    }

    // --- Event Listeners for optional features (to be fully implemented later) ---
    shuffleButton.addEventListener('click', () => {
        if (originalWordList.length > 0) {
            wordList = [...originalWordList]; // Reset to original before shuffling
            shuffleArray(wordList);
            resetQuizState();
            displayNextWord();
            wordInput.style.display = 'block'; // Ensure input is visible
             quizArea.style.display = 'block';
        } else {
            alert("先に単語リストを読み込んでください。");
        }
    });

    retryButton.addEventListener('click', () => {
        if (originalWordList.length > 0) {
            wordList = [...originalWordList]; // Reset to original list
            resetQuizState();
            displayNextWord();
            wordInput.style.display = 'block'; // Ensure input is visible
            quizArea.style.display = 'block';
            reviewArea.style.display = 'none';
        } else {
            alert("先に単語リストを読み込んでください。");
        }
    });

    startReviewButton.addEventListener('click', () => {
        if (incorrectWords.length > 0) {
            isReviewing = true;
            wordList = []; // Clear main list for review session
            currentWordIndex = -1; // Reset index for review
            feedbackDisplay.textContent = '';
            feedbackDisplay.className = '';
            wordInput.value = '';
            wordInput.style.display = 'block';
            startReviewButton.style.display = 'none'; // Hide after starting
            reviewList.style.display = 'none'; // Hide the list during review typing
            displayNextWord();
        }
    });

    function populateReviewList() {
        reviewList.innerHTML = ''; // Clear previous items
        reviewList.style.display = 'block';
        const uniqueIncorrectWords = Array.from(new Set(incorrectWords.map(item => JSON.stringify(item))))
                                       .map(str => JSON.parse(str));

        if (uniqueIncorrectWords.length === 0) {
            reviewList.innerHTML = '<li>間違えた単語はありません。</li>';
            startReviewButton.style.display = 'none';
            return;
        }

        uniqueIncorrectWords.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.word} - ${item.meaning}`;
            reviewList.appendChild(li);
        });
        startReviewButton.style.display = 'inline-block';
    }

    function endReviewSession() {
        isReviewing = false;
        meaningDisplay.textContent = '復習セッションが完了しました！';
        wordInput.style.display = 'none';
        nextButton.style.display = 'none';
        feedbackDisplay.textContent = '';
        reviewArea.style.display = 'block'; // Show review area again
        populateReviewList(); // Show updated list (might be empty if all corrected)
        // Optionally, offer to retry the main list or shuffle etc.
    }


    // --- 3. User Input Check & 4. Feedback Display ---
    wordInput.addEventListener('input', () => {
        // Clear feedback as user types
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = '';
        wordInput.classList.remove('incorrect-input');
    });

    wordInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission if it's in a form
            checkAnswer();
        }
    });

    nextButton.addEventListener('click', () => {
        if (isReviewing) {
            // If correct in review, remove from incorrectWords
            if (feedbackDisplay.className === 'feedback-correct') {
                incorrectWords.splice(currentWordIndex, 1);
            }
        } else {
            // If correct in normal mode, remove from wordList
             if (feedbackDisplay.className === 'feedback-correct' && wordList[currentWordIndex]) {
                wordList.splice(currentWordIndex, 1);
            }
        }
        displayNextWord();
    });

    function checkAnswer() {
        if (currentWordIndex < 0 && !isReviewing) return; // No word selected yet or not in review
        if (isReviewing && incorrectWords.length === 0) return; // No words to review

        const typedWord = wordInput.value.trim();
        if (!typedWord) {
            feedbackDisplay.textContent = '単語を入力してください。';
            feedbackDisplay.className = 'feedback-incorrect'; // Generic warning
            return;
        }

        let correctWordObj;
        if (isReviewing) {
            correctWordObj = incorrectWords[currentWordIndex];
        } else {
            correctWordObj = wordList[currentWordIndex];
        }

        if (!correctWordObj) { // Should not happen if logic is correct
            console.error("Error: correctWordObj is undefined.", "isReviewing:", isReviewing, "currentWordIndex:", currentWordIndex, "wordList:", wordList, "incorrectWords:", incorrectWords);
            feedbackDisplay.textContent = 'エラーが発生しました。リフレッシュしてください。';
            return;
        }

        const correctWord = correctWordObj.word;

        if (typedWord.toLowerCase() === correctWord.toLowerCase()) {
            feedbackDisplay.textContent = `正解！ ${correctWord}`;
            feedbackDisplay.className = 'feedback-correct';
            wordInput.disabled = true; // Disable input after correct answer
            nextButton.style.display = 'inline-block'; // Show next button
            if (!isReviewing) {
                correctAnswers++;
            }
            // Word will be removed from the respective list when 'Next' is clicked
        } else {
            feedbackDisplay.textContent = '不正解。もう一度試してください。';
            feedbackDisplay.className = 'feedback-incorrect';
            wordInput.classList.add('incorrect-input');
            if (!isReviewing) {
                incorrectAnswers++;
                // Add to incorrectWords only if it's not already there from this session for this word
                if (!incorrectWords.find(item => item.word === correctWord && item.meaning === correctWordObj.meaning)) {
                    incorrectWords.push(correctWordObj);
                }
            }
            // Shake animation will be triggered by the CSS class
        }
        if (!isReviewing) {
            updateProgressDisplay();
        }
    }

    // Utility function to shuffle an array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

});
