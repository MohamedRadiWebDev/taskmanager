/**
 * Task Manager Application - Main JavaScript File
 * Trello-style task manager with drag-and-drop functionality
 */

class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.activeFilters = {
            priority: '',
            category: '',
            dueDate: ''
        };
        this.dragThreshold = 100; // pixels
        this.init();
    }

    init() {
        // Initialize audio manager
        window.audioManager = new AudioManager();
        window.audioManager.init();
        
        this.bindEvents();
        this.checkSession();
        
        // Initialize scheduled task checker
        this.startScheduledTaskChecker();
        
        // Initialize category filter options
        this.updateCategoryFilter();
        
        // Start periodic notifications automatically when app loads
        setTimeout(() => {
            window.audioManager.startPeriodicNotifications();
        }, 2000); // Wait 2 seconds after app loads
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Add task form
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTask();
        });

        // Recurrence change
        document.getElementById('recurrence').addEventListener('change', (e) => {
            this.toggleDaysOfWeek(e.target.value);
        });

        // Priority change - play sound preview
        document.getElementById('taskPriority').addEventListener('change', (e) => {
            const priority = e.target.value;
            if (priority && window.audioManager) {
                window.audioManager.playPrioritySound(priority);
            }
        });
    }

    checkSession() {
        const currentUser = localStorage.getItem('taskManagerUser');
        if (currentUser) {
            this.showMainApp();
            this.loadTasks();
            this.renderTasks();
            
            // Update profile
            document.getElementById('userGreeting').textContent = `Welcome, ${currentUser}!`;
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('mainApp').classList.add('d-none');
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    }

    showMainApp() {
        document.getElementById('mainApp').classList.remove('d-none');
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username && password) {
            localStorage.setItem('taskManagerUser', username);
            this.showMainApp();
            this.loadTasks();
            this.renderTasks();
            
            // Update profile
            document.getElementById('userGreeting').textContent = `Welcome, ${username}!`;
        }
    }

    logout() {
        // Stop periodic notifications when logging out
        window.audioManager.stopPeriodicNotifications();
        
        localStorage.removeItem('taskManagerUser');
        localStorage.removeItem('taskManagerTasks');
        this.tasks = [];
        this.showLogin();
    }

    toggleNotifications() {
        const isActive = window.audioManager.togglePeriodicNotifications();
        const button = document.getElementById('notificationToggle');
        const icon = button.querySelector('i');
        
        if (isActive) {
            button.classList.remove('btn-outline-secondary');
            button.classList.add('btn-success');
            icon.className = 'fas fa-bell';
            button.title = 'Notifications ON (every 5 min) - Click to turn off';
        } else {
            button.classList.remove('btn-success');
            button.classList.add('btn-outline-secondary');
            icon.className = 'fas fa-bell-slash';
            button.title = 'Notifications OFF - Click to turn on';
        }
        
        // Show feedback
        const message = isActive ? 'Periodic notifications enabled (every 5 minutes)' : 'Periodic notifications disabled';
        this.showInAppNotification(message, 'info');
    }

    toggleDaysOfWeek(recurrence) {
        const container = document.getElementById('daysOfWeekContainer');
        container.style.display = recurrence === 'custom' ? 'block' : 'none';
    }

    handleAddTask() {
        const formData = this.getTaskFormData();
        
        if (!formData.name) {
            alert('Task name is required');
            return;
        }

        const task = this.createTask(formData);
        this.tasks.push(task);
        this.saveTasks();
        
        // Update category filter options
        this.updateCategoryFilter();
        
        // Play priority-specific add sound and show animation
        window.audioManager.playAddSound(task.priority);
        this.showTaskAnimation('add');
        
        // Add task to DOM with animation
        this.addTaskToDOM(task);
        
        // Reset form and close modal
        document.getElementById('addTaskForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
        modal.hide();
    }

    getTaskFormData() {
        const recurrence = document.getElementById('recurrence').value;
        let daysOfWeek = [];
        
        if (recurrence === 'custom') {
            const checkboxes = document.querySelectorAll('#daysOfWeekContainer input[type="checkbox"]:checked');
            daysOfWeek = Array.from(checkboxes).map(cb => parseInt(cb.value));
        }

        return {
            name: document.getElementById('taskName').value,
            description: document.getElementById('taskDescription').value,
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').value,
            scheduledTime: document.getElementById('scheduledTime').value,
            recurrence: {
                type: recurrence,
                daysOfWeek: daysOfWeek
            }
        };
    }

    createTask(formData) {
        return {
            id: Date.now() + Math.random(),
            name: formData.name,
            description: formData.description,
            category: formData.category,
            priority: formData.priority,
            scheduledTime: formData.scheduledTime ? new Date(formData.scheduledTime).toISOString() : null,
            recurrence: formData.recurrence,
            done: false,
            status: 'todo',
            createdAt: new Date().toISOString(),
            events: {
                onAdd: { sound: 'add', animation: 'add-task' },
                onComplete: { sound: 'complete', animation: 'check' },
                onDelete: { sound: 'delete', animation: 'delete' }
            }
        };
    }

    loadTasks() {
        const saved = localStorage.getItem('taskManagerTasks');
        this.tasks = saved ? JSON.parse(saved) : [];
    }

    saveTasks() {
        localStorage.setItem('taskManagerTasks', JSON.stringify(this.tasks));
    }

    renderTasks() {
        const container = document.getElementById('taskList');
        container.innerHTML = '';

        let filteredTasks = this.getFilteredTasks();

        // Sort tasks by creation date (newest first)
        filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (filteredTasks.length === 0) {
            if (this.searchQuery || this.hasActiveFilters()) {
                container.innerHTML = this.getNoResultsHTML();
            } else {
                container.innerHTML = this.getEmptyStateHTML(this.currentFilter);
            }
        } else {
            filteredTasks.forEach(task => {
                container.appendChild(this.createTaskElement(task));
            });
        }
    }

    getFilteredTasks() {
        let filteredTasks = [];

        // Apply status filter first
        switch (this.currentFilter) {
            case 'todo':
                filteredTasks = this.tasks.filter(task => task.status === 'todo' && !task.done);
                break;
            case 'inprogress':
                filteredTasks = this.tasks.filter(task => task.status === 'inprogress' && !task.done);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => task.done);
                break;
            case 'all':
            default:
                filteredTasks = this.tasks;
                break;
        }

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                task.name.toLowerCase().includes(query) ||
                (task.description && task.description.toLowerCase().includes(query)) ||
                (task.category && task.category.toLowerCase().includes(query))
            );
        }

        // Apply priority filter
        if (this.activeFilters.priority) {
            filteredTasks = filteredTasks.filter(task => task.priority === this.activeFilters.priority);
        }

        // Apply category filter
        if (this.activeFilters.category) {
            filteredTasks = filteredTasks.filter(task => task.category === this.activeFilters.category);
        }

        // Apply due date filter
        if (this.activeFilters.dueDate) {
            filteredTasks = this.filterByDueDate(filteredTasks, this.activeFilters.dueDate);
        }

        return filteredTasks;
    }

    getEmptyStateHTML(filter) {
        const messages = {
            all: { icon: 'fas fa-tasks', title: 'No tasks yet', text: 'Create your first task to get started' },
            todo: { icon: 'fas fa-clipboard-list', title: 'No pending tasks', text: 'All your tasks are completed or in progress' },
            inprogress: { icon: 'fas fa-play', title: 'No tasks in progress', text: 'Move tasks here when you start working on them' },
            completed: { icon: 'fas fa-check-circle', title: 'No completed tasks', text: 'Completed tasks will appear here' }
        };

        const { icon, title, text } = messages[filter] || messages.all;
        return `
            <div class="empty-state">
                <i class="${icon}"></i>
                <h3>${title}</h3>
                <p>${text}</p>
            </div>
        `;
    }

    createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${task.done ? 'completed' : ''}`;
        taskEl.dataset.taskId = task.id;

        // Add scheduled indicator
        if (task.scheduledTime) {
            const isOverdue = new Date(task.scheduledTime) < new Date();
            taskEl.classList.add(isOverdue ? 'task-overdue' : 'task-scheduled');
        }

        const priorityIcons = {
            high: '🔥',
            medium: '☕',
            low: 'zzz'
        };

        taskEl.innerHTML = `
            <div class="task-card-content">
                <div class="task-card-left">
                    <div class="priority-icon ${task.priority}">
                        ${priorityIcons[task.priority]}
                    </div>
                    <div class="task-card-main">
                        <h6 class="task-title">${this.highlightSearchTerms(this.escapeHtml(task.name))}</h6>
                        ${task.description ? `
                            <p class="task-description">${this.highlightSearchTerms(this.escapeHtml(task.description))}</p>
                        ` : ''}
                        <div class="task-metadata">
                            <span class="task-status-badge ${task.status}">${this.getStatusText(task.status, task.done)}</span>
                            ${task.category ? `<span class="task-category">${this.highlightSearchTerms(this.escapeHtml(task.category))}</span>` : ''}
                            ${task.scheduledTime ? `
                                <div class="task-time">
                                    <i class="fas fa-clock"></i>
                                    ${this.formatDateTime(task.scheduledTime)}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="task-card-right">
                    <div class="task-actions">
                        ${!task.done ? `
                            <button class="task-action-btn complete" onclick="taskManager.completeTask('${task.id}')" title="Complete Task">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="task-action-btn" onclick="taskManager.toggleTaskStatus('${task.id}')" title="Change Status">
                                <i class="fas fa-arrow-right"></i>
                            </button>
                        ` : ''}
                        <button class="task-action-btn delete" onclick="taskManager.deleteTask('${task.id}')" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add swipe-to-delete functionality
        this.addSwipeListeners(taskEl);

        return taskEl;
    }

    addSwipeListeners(taskEl) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;
        let truck = null;
        let dragStarted = false;
        
        const handleStart = (e) => {
            // Prevent if clicking on action buttons
            if (e.target.closest('.task-action-btn')) {
                return;
            }
            
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            currentX = clientX;
            isDragging = false;
            dragStarted = true;
            
            taskEl.style.transition = 'none';
            
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchmove', handleMove, { passive: false });
            document.addEventListener('touchend', handleEnd);
        };
        
        const handleMove = (e) => {
            if (!dragStarted) return;
            
            e.preventDefault();
            
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            
            // Only start dragging if horizontal movement is greater than vertical and moving left
            if (!isDragging && Math.abs(deltaX) > 15 && deltaX < 0) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    isDragging = true;
                    taskEl.classList.add('dragging');
                    
                    // Create truck element when dragging starts - starts from far left
                    truck = this.createTruckElement();
                    document.body.appendChild(truck);
                    
                    // Get initial task position for truck starting point
                    const initialTaskRect = taskEl.getBoundingClientRect();
                    truck.initialLeft = window.innerWidth + 70; // Start from far right of screen
                    truck.taskTop = initialTaskRect.top + initialTaskRect.height / 2 - 15;
                    
                    // Position truck initially off-screen to the right
                    truck.style.left = truck.initialLeft + 'px';
                    truck.style.top = truck.taskTop + 'px';
                    truck.style.display = 'block';
                    truck.style.visibility = 'visible';
                    truck.classList.add('truck-slide-in');
                    
                    console.log('Truck created and sliding in from left');
                }
            }
            
            if (isDragging && deltaX < 0) { // Only allow leftward drag
                const translateX = Math.max(deltaX, -250); // Limit drag distance
                taskEl.style.transform = `translateX(${translateX}px)`;
                
                // Position truck to move with the slide - starts from far right screen edge
                // and moves left proportionally with the drag (same direction as slide)
                const dragProgress = Math.abs(translateX) / 250; // Progress from 0 to 1
                const truckStartX = window.innerWidth + 70; // Start position (off-screen right)
                const truckEndX = -100; // End position (off-screen left)
                const truckX = truckStartX + (truckEndX - truckStartX) * dragProgress;
                const truckY = truck.taskTop;
                
                truck.style.left = truckX + 'px';
                truck.style.top = truckY + 'px';
                
                // Show opacity based on drag distance
                const opacity = Math.min(Math.abs(deltaX) / this.dragThreshold, 1);
                truck.style.opacity = opacity;
                
                console.log(`Truck positioned at: ${truckX}, ${truckY}, opacity: ${opacity}, translateX: ${translateX}, progress: ${dragProgress}`);
            }
        };
        
        const handleEnd = (e) => {
            if (!dragStarted) return;
            
            dragStarted = false;
            
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
            
            const deltaX = currentX - startX;
            
            taskEl.classList.remove('dragging');
            taskEl.style.transition = 'transform 0.3s ease';
            
            if (isDragging && deltaX < -this.dragThreshold) {
                // Task dragged far enough - delete it with full slide-out animation
                taskEl.classList.add('slide-out');
                truck.classList.add('truck-slide-out');
                
                window.audioManager.playDeleteSound();
                this.showTaskAnimation('delete');
                
                setTimeout(() => {
                    this.deleteTask(taskEl.dataset.taskId);
                }, 500); // Wait for full animation
            } else {
                // Reset position with smooth transition
                taskEl.style.transform = 'translateX(0)';
                
                // Animate truck back to right side
                if (truck) {
                    truck.style.transition = 'left 0.3s ease';
                    truck.style.left = (window.innerWidth + 70) + 'px';
                    setTimeout(() => {
                        if (truck.style) truck.style.transition = 'none';
                    }, 300);
                }
            }
            
            // Clean up truck
            if (truck) {
                setTimeout(() => {
                    if (truck.parentElement) {
                        truck.remove();
                        console.log('Truck removed from DOM');
                    }
                }, 600);
            }
            
            isDragging = false;
            truck = null;
        };
        
        taskEl.addEventListener('mousedown', handleStart);
        taskEl.addEventListener('touchstart', handleStart, { passive: true });
    }
    
    createTruckElement() {
        const truck = document.createElement('div');
        truck.className = 'truck-animation';
        truck.style.cssText = `
            position: fixed;
            z-index: 9999;
            display: none;
            visibility: hidden;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.1s ease;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        `;
        
        truck.innerHTML = `
            <div class="truck-container">
                <img src="images/truck.svg" alt="Truck" width="50" height="30" class="truck-svg">
                <div class="dust-effect">
                    <div class="dust-particle"></div>
                    <div class="dust-particle"></div>
                    <div class="dust-particle"></div>
                    <div class="dust-particle"></div>
                    <div class="dust-particle"></div>
                    <div class="dust-particle"></div>
                    <div class="dust-particle"></div>
                    <div class="dust-particle"></div>
                </div>
            </div>
        `;
        
        return truck;
    }

    // Old drag-to-trash functionality removed - replaced with swipe-to-delete

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id == taskId);
        if (task) {
            // Check if task has recurrence
            if (task.recurrence && task.recurrence.type !== 'none' && task.scheduledTime) {
                // Update scheduled time based on recurrence type
                const currentTime = new Date(task.scheduledTime);
                let nextTime;
                
                switch (task.recurrence.type) {
                    case 'daily':
                        nextTime = new Date(currentTime);
                        nextTime.setDate(nextTime.getDate() + 1);
                        break;
                    case 'weekly':
                        nextTime = new Date(currentTime);
                        nextTime.setDate(nextTime.getDate() + 7);
                        break;
                    case 'monthly':
                        nextTime = new Date(currentTime);
                        nextTime.setMonth(nextTime.getMonth() + 1);
                        break;
                    case 'custom':
                        // Handle custom day-of-week recurrence
                        nextTime = this.calculateNextRecurrence(currentTime, task.recurrence);
                        break;
                    default:
                        nextTime = null;
                }
                
                if (nextTime) {
                    // Update task for next occurrence
                    task.scheduledTime = nextTime.toISOString();
                    task.done = false;
                    task.status = 'todo';
                    
                    // Show notification about recurring task
                    this.showTaskNotification(task, 'recurring');
                }
            } else {
                // Regular task completion
                task.done = true;
                task.status = 'completed';
            }
            
            // Play sound and show animation
            window.audioManager.playCompleteSound();
            this.showTaskAnimation('complete');
            
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id != taskId);
        
        // Update category filter options
        this.updateCategoryFilter();
        
        window.audioManager.playDeleteSound();
        this.showTaskAnimation('delete');
        
        this.saveTasks();
        this.renderTasks();
    }

    addTaskToDOM(task) {
        // Just re-render all tasks to maintain proper sorting and filtering
        this.renderTasks();
    }

    showTaskAnimation(type) {
        const overlay = document.getElementById('animationOverlay');
        const content = overlay.querySelector('.animation-content');
        
        let message = '';
        let icon = '';
        
        switch (type) {
            case 'add':
                message = 'Task Added Successfully!';
                icon = 'fas fa-plus-circle text-success';
                break;
            case 'complete':
                message = 'Task Completed!';
                icon = 'fas fa-check-circle text-success';
                break;
            case 'delete':
                message = 'Task Deleted!';
                icon = 'fas fa-trash text-danger';
                break;
        }
        
        content.innerHTML = `
            <i class="${icon}" style="font-size: 4rem; margin-bottom: 1rem;"></i>
            <h4>${message}</h4>
        `;
        
        overlay.classList.remove('d-none');
        
        setTimeout(() => {
            overlay.classList.add('d-none');
        }, 1500);
    }

    checkScheduledTasks() {
        const now = new Date();
        let hasUpdates = false;
        
        this.tasks.forEach(task => {
            if (!task.scheduledTime || task.done) return;
            
            const scheduledTime = new Date(task.scheduledTime);
            
            if (scheduledTime <= now) {
                // Task is due
                if (task.recurrence.type !== 'none') {
                    // Handle recurring task
                    const nextTime = this.calculateNextRecurrence(scheduledTime, task.recurrence);
                    if (nextTime) {
                        task.scheduledTime = nextTime.toISOString();
                        hasUpdates = true;
                        
                        // Show notification for recurring task
                        this.showTaskNotification(task, 'recurring');
                    }
                } else {
                    // Mark non-recurring task as due
                    this.showTaskNotification(task, 'due');
                }
            }
        });
        
        if (hasUpdates) {
            this.saveTasks();
            this.renderTasks();
        }
    }

    calculateNextRecurrence(currentTime, recurrence) {
        const nextTime = new Date(currentTime);
        
        switch (recurrence.type) {
            case 'daily':
                nextTime.setDate(nextTime.getDate() + 1);
                break;
            case 'weekly':
                nextTime.setDate(nextTime.getDate() + 7);
                break;
            case 'monthly':
                nextTime.setMonth(nextTime.getMonth() + 1);
                break;
            case 'custom':
                if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
                    nextTime.setDate(nextTime.getDate() + 1);
                    while (!recurrence.daysOfWeek.includes(nextTime.getDay())) {
                        nextTime.setDate(nextTime.getDate() + 1);
                    }
                }
                break;
            default:
                return null;
        }
        
        return nextTime;
    }

    showTaskNotification(task, type) {
        // Simple notification (could be enhanced with browser notifications)
        let message;
        
        switch (type) {
            case 'recurring':
                const nextDate = new Date(task.scheduledTime);
                message = `Task "${task.name}" completed! Next occurrence: ${this.formatDateTime(task.scheduledTime)}`;
                break;
            case 'due':
                message = `Task "${task.name}" is due now!`;
                break;
            default:
                message = `Task "${task.name}" notification`;
        }
        
        console.log(message);
        
        // Show in-app notification
        this.showInAppNotification(message, type);
        
        // Browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(message);
        }
    }

    showInAppNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'recurring' ? 'success' : 'info'} notification-toast`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'recurring' ? 'sync-alt' : 'bell'} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    startScheduledTaskChecker() {
        // Check every minute
        setInterval(() => {
            this.checkScheduledTasks();
        }, 60000);
        
        // Initial check
        this.checkScheduledTasks();
    }

    formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Re-render tasks with new filter
        this.renderTasks();
    }

    getStatusText(status, done) {
        if (done) return 'Completed';
        
        switch (status) {
            case 'todo': return 'To Do';
            case 'inprogress': return 'In Progress';
            case 'completed': return 'Completed';
            default: return 'To Do';
        }
    }

    toggleTaskStatus(taskId) {
        const task = this.tasks.find(t => t.id == taskId);
        if (task && !task.done) {
            // Cycle through statuses: todo -> inprogress -> todo
            if (task.status === 'todo') {
                task.status = 'inprogress';
            } else if (task.status === 'inprogress') {
                task.status = 'todo';
            }
            
            this.saveTasks();
            this.renderTasks();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Search and Filter Methods
    handleSearch() {
        const searchInput = document.getElementById('taskSearch');
        this.searchQuery = searchInput.value.trim();
        
        const clearButton = document.getElementById('clearSearch');
        clearButton.style.display = this.searchQuery ? 'block' : 'none';
        
        this.renderTasks();
    }

    clearSearch() {
        document.getElementById('taskSearch').value = '';
        this.searchQuery = '';
        document.getElementById('clearSearch').style.display = 'none';
        this.renderTasks();
    }

    applyFilters() {
        this.activeFilters.priority = document.getElementById('priorityFilter').value;
        this.activeFilters.category = document.getElementById('categoryFilter').value;
        this.activeFilters.dueDate = document.getElementById('dueDateFilter').value;
        
        this.renderTasks();
    }

    clearAllFilters() {
        // Clear search
        this.clearSearch();
        
        // Clear advanced filters
        document.getElementById('priorityFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('dueDateFilter').value = '';
        
        this.activeFilters = {
            priority: '',
            category: '',
            dueDate: ''
        };
        
        // Reset to 'all' filter
        this.setFilter('all');
    }

    hasActiveFilters() {
        return this.searchQuery || 
               this.activeFilters.priority || 
               this.activeFilters.category || 
               this.activeFilters.dueDate;
    }

    filterByDueDate(tasks, filter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

        return tasks.filter(task => {
            if (!task.scheduledTime) return false;
            
            const dueDate = new Date(task.scheduledTime);
            const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

            switch (filter) {
                case 'overdue':
                    return dueDate < now && !task.done;
                case 'today':
                    return dueDateOnly.getTime() === today.getTime();
                case 'week':
                    return dueDate >= today && dueDate <= weekFromNow;
                case 'month':
                    return dueDate >= today && dueDate <= monthFromNow;
                default:
                    return true;
            }
        });
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const categories = [...new Set(this.tasks.map(task => task.category).filter(cat => cat))];
        
        // Clear existing options (except "All Categories")
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        // Add unique categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    getNoResultsHTML() {
        let message = 'No tasks found';
        let suggestion = 'Try adjusting your search or filters';
        
        if (this.searchQuery) {
            message = `No tasks found for "${this.searchQuery}"`;
            suggestion = 'Try different keywords or check your spelling';
        }

        return `
            <div class="no-search-results">
                <i class="fas fa-search"></i>
                <h3>${message}</h3>
                <p>${suggestion}</p>
                <button class="btn btn-outline-primary" onclick="taskManager.clearAllFilters()">
                    <i class="fas fa-undo me-2"></i>Clear All Filters
                </button>
            </div>
        `;
    }

    highlightSearchTerms(text) {
        if (!this.searchQuery || !text) return text;
        
        const regex = new RegExp(`(${this.searchQuery})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }
}

// Global functions for HTML event handlers
function logout() {
    taskManager.logout();
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});