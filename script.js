// Theme Management
const getStoredTheme = () => localStorage.getItem('theme') || 'light';
const setStoredTheme = theme => localStorage.setItem('theme', theme);

// Apply theme on load
document.documentElement.setAttribute('data-theme', getStoredTheme());

// Create theme toggle button
const themeToggle = document.createElement('button');
themeToggle.className = 'theme-toggle';
themeToggle.innerHTML = `<i class="fas ${getStoredTheme() === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
document.body.appendChild(themeToggle);

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    setStoredTheme(newTheme);
    themeToggle.innerHTML = `<i class="fas ${newTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
});

// Enhanced Animations
const animateElement = (element, animation) => {
    element.style.animation = animation;
    element.addEventListener('animationend', () => {
        element.style.animation = '';
    }, { once: true });
};

// Confetti Effect for Successful Actions
const showConfetti = () => {
    const colors = ['#6366f1', '#ec4899', '#10b981', '#eab308'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.setProperty('--confetti-color', colors[Math.floor(Math.random() * colors.length)]);
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
};

// Add ripple effect to buttons
document.addEventListener('click', function(e) {
    if (e.target.matches('button:not(.theme-toggle)')) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        e.target.appendChild(ripple);
        
        const rect = e.target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        
        const x = e.clientX - rect.left - size/2;
        const y = e.clientY - rect.top - size/2;
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        setTimeout(() => ripple.remove(), 1000);
    }
});

// Add hover card effect
document.querySelectorAll('.question-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--x-pos', `${x}px`);
        card.style.setProperty('--y-pos', `${y}px`);
    });
});

// Enhance success message with confetti
const showEnhancedSuccess = (message) => {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(successMessage);
    showConfetti();

    setTimeout(() => {
        successMessage.style.opacity = '0';
        successMessage.style.transform = 'translateX(100%)';
        setTimeout(() => successMessage.remove(), 300);
    }, 2000);
};

// Data storage
let questions = [];
let currentQuestionId = 0;

// DOM Elements
const questionsList = document.getElementById('questionsList');
const questionForm = document.getElementById('questionForm');
const askQuestionBtn = document.querySelector('.ask-question-btn');
const modal = document.getElementById('questionModal');
const filterBtns = document.querySelectorAll('.filter-btn');
const loadingScreen = document.querySelector('.loading-screen');

// Add character count functionality
const questionTitle = document.getElementById('questionTitle');
const questionContent = document.getElementById('questionContent');

// Enhanced User Profile System
const profiles = {
    muqeet: {
        name: "Muqeet",
        email: "muqeet@example.com",
        image: "https://ui-avatars.com/api/?name=Muqeet&background=6366f1&color=fff&size=150",
        questionsAsked: 5,
        questionsAnswered: 12,
        likesReceived: 45,
        dislikesReceived: 2,
        reputation: 128,
        isGuest: false,
        badges: ["Top Contributor", "Problem Solver", "Quick Responder"],
        joinDate: new Date('2024-01-01')
    }
};

// Current active profile
let currentProfile = profiles.muqeet;

function updateCharacterCount(input) {
    const maxLength = input.id === 'questionTitle' ? 100 : 1000;
    const currentLength = input.value.length;
    input.parentElement.setAttribute('data-length', `${currentLength}/${maxLength}`);
}

questionTitle.addEventListener('input', () => updateCharacterCount(questionTitle));
questionContent.addEventListener('input', () => updateCharacterCount(questionContent));

// Helper Functions
const generateId = () => ++currentQuestionId;

const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};

// Function to switch profile
const switchProfile = (profileKey) => {
    currentProfile = profiles[profileKey];
    renderQuestions(questions);
};

// Function to update profile stats
const updateProfileStats = (profileKey, action) => {
    const profile = profiles[profileKey];
    switch(action) {
        case 'question':
            profile.questionsAsked++;
            break;
        case 'answer':
            profile.questionsAnswered++;
            break;
        case 'like':
            profile.likesReceived++;
            break;
        case 'dislike':
            profile.dislikesReceived++;
            break;
    }
    renderQuestions(questions);
};

// Enhanced Question Card Template
const createQuestionCard = (question) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.style.opacity = '0';
    
    const hasNewAnswers = question.answers.some(answer => {
        const timeDiff = new Date() - new Date(answer.timestamp);
        return timeDiff < 3600000;
    });

    card.innerHTML = `
        <h3>${question.title}</h3>
        <p>${question.content.substring(0, 150)}${question.content.length > 150 ? '...' : ''}</p>
        <div class="question-meta">
            <span><i class="far fa-clock"></i> ${formatDate(question.timestamp)}</span>
            <span class="answer-count ${hasNewAnswers ? 'has-new-answers' : ''}">
                <i class="far fa-comments"></i> ${question.answers.length} answer${question.answers.length !== 1 ? 's' : ''}
            </span>
            <span><i class="far fa-heart"></i> ${question.likes} like${question.likes !== 1 ? 's' : ''}</span>
            <span><i class="far fa-thumbs-down"></i> ${question.dislikes || 0} dislike${(question.dislikes || 0) !== 1 ? 's' : ''}</span>
        </div>
        <div class="question-preview-actions">
            <button class="view-answers">
                <i class="fas fa-chevron-right"></i>
                View Discussion
            </button>
        </div>
    `;

    // Add click event to open modal
    card.querySelector('.view-answers').addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
            showQuestionDetails(question);
        }, 150);
    });

    setTimeout(() => {
        card.style.transition = 'all 0.3s var(--transition-timing)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);

    return card;
};

// Function to show question details
const showQuestionDetails = (question) => {
    const modalContent = modal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2 class="question-title">${question.title}</h2>
            <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="question-content">
                <p class="question-text">${question.content}</p>
                <div class="question-meta">
                    <span><i class="far fa-clock"></i> ${formatDate(question.timestamp)}</span>
                    <span><i class="fas fa-eye"></i> ${Math.floor(Math.random() * 100) + 10} views</span>
                </div>
                <div class="vote-buttons">
                    <button class="vote-btn upvote ${question.userLiked ? 'active' : ''}" onclick="toggleLike(${question.id})">
                        <i class="far fa-heart"></i>
                        <span>${question.likes}</span>
                    </button>
                    <button class="vote-btn downvote ${question.userDisliked ? 'active' : ''}" onclick="toggleDislike(${question.id})">
                        <i class="far fa-thumbs-down"></i>
                        <span>${question.dislikes || 0}</span>
                    </button>
                </div>
            </div>

            <div class="answers-section">
                <h3><i class="fas fa-comments"></i> ${question.answers.length} Answers</h3>
                <div class="answers-list"></div>
                
                <form class="answer-form" id="answerForm">
                    <textarea placeholder="Share your knowledge or experience..." required></textarea>
                    <button type="submit" class="submit-answer-btn">
                        <i class="fas fa-paper-plane"></i>
                        Post Answer
                    </button>
                </form>
            </div>
        </div>
    `;

    // Render answers with animation
    const answersList = modalContent.querySelector('.answers-list');
    question.answers.forEach((answer, index) => {
        const answerElement = document.createElement('div');
        answerElement.className = 'answer-card';
        answerElement.style.opacity = '0';
        answerElement.style.transform = 'translateY(20px)';
        
        answerElement.innerHTML = `
            <div class="answer-content">
                <p>${answer.content}</p>
            </div>
            <div class="answer-meta">
                <span class="answer-time">
                    <i class="far fa-clock"></i>
                    ${formatDate(answer.timestamp)}
                </span>
                <div class="vote-buttons">
                    <button class="vote-btn upvote ${answer.userLiked ? 'active' : ''}" 
                            onclick="toggleAnswerLike(${question.id}, ${answer.id})">
                        <i class="far fa-heart"></i>
                        <span>${answer.likes || 0}</span>
                    </button>
                    <button class="vote-btn downvote ${answer.userDisliked ? 'active' : ''}"
                            onclick="toggleAnswerDislike(${question.id}, ${answer.id})">
                        <i class="far fa-thumbs-down"></i>
                        <span>${answer.dislikes || 0}</span>
                    </button>
                </div>
            </div>
        `;
        
        answersList.appendChild(answerElement);

        // Animate answer entrance with delay based on index
        setTimeout(() => {
            answerElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            answerElement.style.opacity = '1';
            answerElement.style.transform = 'translateY(0)';
        }, 100 * (index + 1));
    });

    modal.classList.add('active');
    
    // Animate modal entrance
    modalContent.style.transform = 'scale(0.9)';
    modalContent.style.opacity = '0';
    
    requestAnimationFrame(() => {
        modalContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        modalContent.style.transform = 'scale(1)';
        modalContent.style.opacity = '1';
    });

    // Handle answer form submission
    const answerForm = modalContent.querySelector('#answerForm');
    answerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const textarea = e.target.querySelector('textarea');
        const content = textarea.value;
        
        if (!content.trim()) return;
        
        // Animate button during submission
        const submitBtn = e.target.querySelector('.submit-answer-btn');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        submitBtn.disabled = true;
        
        // Simulate submission delay
        setTimeout(() => {
            const newAnswer = {
                id: Date.now(),
                content,
                timestamp: new Date(),
                likes: 0,
                dislikes: 0,
                userLiked: false,
                userDisliked: false
            };

            question.answers.push(newAnswer);
            
            // Add new answer with animation
            const answerElement = document.createElement('div');
            answerElement.className = 'answer-card';
            answerElement.style.opacity = '0';
            answerElement.style.transform = 'translateY(20px)';
            
            answerElement.innerHTML = `
                <div class="answer-content">
                    <p>${content}</p>
                </div>
                <div class="answer-meta">
                    <span class="answer-time">
                        <i class="far fa-clock"></i>
                        Just now
                    </span>
                    <div class="vote-buttons">
                        <button class="vote-btn upvote" onclick="toggleAnswerLike(${question.id}, ${newAnswer.id})">
                            <i class="far fa-heart"></i>
                            <span>0</span>
                        </button>
                        <button class="vote-btn downvote" onclick="toggleAnswerDislike(${question.id}, ${newAnswer.id})">
                            <i class="far fa-thumbs-down"></i>
                            <span>0</span>
                        </button>
                    </div>
                </div>
            `;
            
            answersList.appendChild(answerElement);
            
            // Animate new answer entrance
            requestAnimationFrame(() => {
                answerElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                answerElement.style.opacity = '1';
                answerElement.style.transform = 'translateY(0)';
            });
            
            // Reset form with animation
            textarea.style.transition = 'all 0.3s ease';
            textarea.style.transform = 'translateY(-10px)';
            textarea.style.opacity = '0';
            
            setTimeout(() => {
                e.target.reset();
                textarea.style.transform = '';
                textarea.style.opacity = '1';
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Answer';
                submitBtn.disabled = false;
                
                // Update answers count
                const answersTitle = modalContent.querySelector('.answers-section h3');
                answersTitle.innerHTML = `<i class="fas fa-comments"></i> ${question.answers.length} Answers`;
                
                // Show success message
                showEnhancedSuccess('Answer posted successfully!');
            }, 300);
        }, 1000);
    });
};

// Enhanced Like Animation
const toggleLike = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    question.userLiked = !question.userLiked;
    question.likes += question.userLiked ? 1 : -1;

    // Update UI with animation
    const likeBtn = document.querySelector(`.like-btn[onclick="toggleLike(${questionId})"]`);
    const likeCount = likeBtn.querySelector('.like-count');
    const heart = likeBtn.querySelector('i');
    
    likeBtn.classList.toggle('liked');
    likeCount.textContent = question.likes;

    // Animate heart icon
    heart.style.transform = 'scale(1.5)';
    heart.style.transition = 'transform 0.2s var(--transition-timing)';
    setTimeout(() => {
        heart.style.transform = 'scale(1)';
    }, 200);

    // Add pulse animation to the button
    likeBtn.style.animation = 'pulse 0.3s var(--transition-timing)';
    setTimeout(() => {
        likeBtn.style.animation = '';
    }, 300);
};

// Enhanced Answer Like Animation
const toggleAnswerLike = (questionId, answerId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const answer = question.answers.find(a => a.id === answerId);
    if (!answer) return;

    answer.userLiked = !answer.userLiked;
    answer.likes += answer.userLiked ? 1 : -1;

    // Update UI with animation
    const likeBtn = document.querySelector(`.like-btn[onclick="toggleAnswerLike(${questionId}, ${answerId})"]`);
    const likeCount = likeBtn.querySelector('.like-count');
    const heart = likeBtn.querySelector('i');
    
    likeBtn.classList.toggle('liked');
    likeCount.textContent = answer.likes;

    // Animate heart icon
    heart.style.transform = 'scale(1.5)';
    heart.style.transition = 'transform 0.2s var(--transition-timing)';
    setTimeout(() => {
        heart.style.transform = 'scale(1)';
    }, 200);

    // Add pulse animation to the button
    likeBtn.style.animation = 'pulse 0.3s var(--transition-timing)';
    setTimeout(() => {
        likeBtn.style.animation = '';
    }, 300);
};

// Filter questions
const filterQuestions = (filter) => {
    let filteredQuestions = [...questions];

    switch(filter) {
        case 'popular':
            filteredQuestions.sort((a, b) => b.likes - a.likes);
            break;
        case 'unanswered':
            filteredQuestions = filteredQuestions.filter(q => q.answers.length === 0);
            break;
        default: // latest
            filteredQuestions.sort((a, b) => b.timestamp - a.timestamp);
    }

    renderQuestions(filteredQuestions);
};

// Render questions list
const renderQuestions = (questionsToRender) => {
    questionsList.innerHTML = '';
    questionsToRender.forEach(question => {
        questionsList.appendChild(createQuestionCard(question));
    });
};

// Event Listeners
askQuestionBtn.addEventListener('click', () => {
    const form = questionForm;
    
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        form.style.opacity = '0';
        form.style.transform = 'translateY(-20px)';
        
        requestAnimationFrame(() => {
            form.style.transition = 'all 0.3s var(--transition-timing)';
            form.style.opacity = '1';
            form.style.transform = 'translateY(0)';
            questionTitle.focus();
        });
    } else {
        form.style.opacity = '0';
        form.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            form.classList.add('hidden');
            form.style.transform = '';
        }, 300);
    }
});

// Cancel button handler
document.querySelector('.cancel-btn').addEventListener('click', () => {
    const form = questionForm;
    form.style.opacity = '0';
    form.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        form.classList.add('hidden');
        form.reset();
        form.style.transform = '';
    }, 300);
});

// Update the form submission to use enhanced success message
questionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = e.target.questionTitle.value;
    const content = e.target.questionContent.value;

    if (title.length > 100 || content.length > 1000) {
        return;
    }

    const newQuestion = {
        id: generateId(),
        title,
        content,
        timestamp: new Date(),
        likes: 0,
        userLiked: false,
        answers: []
    };

    // Update user statistics
    currentProfile.questionsAsked++;

    // Animate form submission
    const form = e.target;
    form.style.transform = 'scale(0.95) translateY(0)';
    form.style.opacity = '0.5';

    setTimeout(() => {
        questions.unshift(newQuestion);
        renderQuestions(questions);
        
        form.reset();
        form.style.transform = 'translateY(-20px)';
        form.style.opacity = '0';
        
        setTimeout(() => {
            form.classList.add('hidden');
            form.style.transform = '';
            form.style.opacity = '';
            
            showEnhancedSuccess('Question posted successfully!');
        }, 300);
    }, 300);
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterQuestions(btn.dataset.filter);
    });
});

// Close modal when clicking outside or on close button
modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('close-modal')) {
        modal.classList.remove('active');
    }
});

// Add answer
document.getElementById('answerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const content = e.target.querySelector('textarea').value;
    const questionId = parseInt(modal.querySelector('.like-btn').getAttribute('onclick').match(/\d+/)[0]);
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const newAnswer = {
        id: question.answers.length + 1,
        content,
        timestamp: new Date(),
        likes: 0,
        userLiked: false
    };

    question.answers.push(newAnswer);
    showQuestionDetails(question);
    
    // Reset form
    e.target.reset();
});

// Remove loading screen after 2 seconds
setTimeout(() => {
    loadingScreen.style.display = 'none';
}, 2000);

// Initialize with sample data
questions = [
    {
        id: generateId(),
        title: "How do I prepare for technical interviews?",
        content: "I have upcoming technical interviews with major tech companies. What's the best way to prepare? Should I focus on algorithms, system design, or both?",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        likes: 5,
        userLiked: false,
        answers: []
    },
    {
        id: generateId(),
        title: "Best resources for learning React?",
        content: "I'm new to React and looking for the best resources to learn. What courses, tutorials, or documentation would you recommend for a beginner?",
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        likes: 3,
        userLiked: false,
        answers: [
            {
                id: 1,
                content: "I highly recommend the official React documentation. It's well-written and includes interactive examples.",
                timestamp: new Date(Date.now() - 3600000),
                likes: 2,
                userLiked: false
            }
        ]
    }
];

// Initial render
renderQuestions(questions);

// Function to create an answer card
const createAnswerCard = (answer) => {
    const answerCard = document.createElement('div');
    answerCard.className = 'answer-card';
    
    answerCard.innerHTML = `
        <div class="answer-content">
            ${answer.content}
        </div>
        <div class="answer-meta">
            <span class="answer-time">
                <i class="far fa-clock"></i>
                ${formatDate(answer.timestamp)}
            </span>
            <div class="vote-buttons">
                <button class="vote-btn upvote ${answer.userVoted === 'up' ? 'active' : ''}" 
                        onclick="handleVote(${answer.id}, 'up')">
                    <i class="fas fa-arrow-up"></i>
                    <span>${answer.upvotes || 0}</span>
                </button>
                <button class="vote-btn downvote ${answer.userVoted === 'down' ? 'active' : ''}"
                        onclick="handleVote(${answer.id}, 'down')">
                    <i class="fas fa-arrow-down"></i>
                    <span>${answer.downvotes || 0}</span>
                </button>
            </div>
        </div>
    `;
    
    return answerCard;
};

// Function to handle answer submission
const handleAnswerSubmit = (e) => {
    e.preventDefault();
    const content = e.target.answerContent.value;
    
    if (!content.trim()) return;

    const newAnswer = {
        id: Date.now(),
        content,
        timestamp: new Date(),
        upvotes: 0,
        downvotes: 0,
        userVoted: null
    };

    // Add animation to the form
    e.target.style.transform = 'scale(0.95)';
    e.target.style.opacity = '0.5';

    setTimeout(() => {
        const currentQuestion = questions.find(q => q.id === currentQuestionId);
        currentQuestion.answers.push(newAnswer);
        
        // Update the answers display
        const answersList = document.querySelector('.answers-list');
        const answerCard = createAnswerCard(newAnswer);
        answerCard.style.opacity = '0';
        answerCard.style.transform = 'translateY(20px)';
        answersList.appendChild(answerCard);

        // Reset and animate the form
        e.target.reset();
        e.target.style.transform = '';
        e.target.style.opacity = '';

        // Animate the new answer card
        requestAnimationFrame(() => {
            answerCard.style.transition = 'all 0.3s var(--transition-timing)';
            answerCard.style.opacity = '1';
            answerCard.style.transform = 'translateY(0)';
        });

        // Show success message
        showEnhancedSuccess('Answer posted successfully!');
    }, 300);
};

// Function to handle voting
const handleVote = (answerId, voteType) => {
    const currentQuestion = questions.find(q => q.id === currentQuestionId);
    const answer = currentQuestion.answers.find(a => a.id === answerId);
    
    if (answer.userVoted === voteType) {
        // Undo vote
        answer.userVoted = null;
        if (voteType === 'up') answer.upvotes--;
        else answer.downvotes--;
    } else {
        // Remove previous vote if exists
        if (answer.userVoted === 'up') answer.upvotes--;
        if (answer.userVoted === 'down') answer.downvotes--;
        
        // Add new vote
        answer.userVoted = voteType;
        if (voteType === 'up') answer.upvotes++;
        else answer.downvotes++;
    }
    
    // Update the display
    renderAnswers(currentQuestion.answers);
};

// Function to render answers
const renderAnswers = (answers) => {
    const answersList = document.querySelector('.answers-list');
    answersList.innerHTML = '';
    answers.forEach(answer => {
        const answerCard = createAnswerCard(answer);
        answersList.appendChild(answerCard);
    });
}; 