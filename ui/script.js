// Main Tab switching functionality
function switchTab(event, tabName) {
    const tabs = document.querySelectorAll('.tab');
    const panes = document.querySelectorAll('.tab-pane');

    // Bỏ active của tất cả các tab và pane
    tabs.forEach(tab => tab.classList.remove('active'));
    panes.forEach(pane => pane.classList.remove('active'));

    // Thêm active cho tab và pane được click
    event.currentTarget.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}


document.addEventListener('DOMContentLoaded', () => {
    // Simulate real-time notification updates
    setInterval(() => {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const currentCount = parseInt(badge.textContent);
            const newCount = Math.floor(Math.random() * 10) + 1;
            if (newCount !== currentCount) {
                badge.textContent = newCount;
                badge.classList.add('pulse');
                setTimeout(() => badge.classList.remove('pulse'), 2000);
            }
        }
    }, 15000);
});

// Main Tab switching functionality
function switchTab(event, tabName) {
    const tabs = document.querySelectorAll('.tab');
    const panes = document.querySelectorAll('.tab-pane');

    // Bỏ active của tất cả các tab và pane
    tabs.forEach(tab => tab.classList.remove('active'));
    panes.forEach(pane => pane.classList.remove('active'));

    // Thêm active cho tab và pane được click
    event.currentTarget.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}


document.addEventListener('DOMContentLoaded', () => {
    // Simulate real-time notification updates
    setInterval(() => {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const currentCount = parseInt(badge.textContent);
            const newCount = Math.floor(Math.random() * 10) + 1;
            if (newCount !== currentCount) {
                badge.textContent = newCount;
                badge.classList.add('pulse');
                setTimeout(() => badge.classList.remove('pulse'), 2000);
            }
        }
    }, 15000);
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectName = card.getAttribute('data-project-name');
            if (projectName) {
                alert(`Opening project: ${projectName}`);
            }
        });
    });
});



document.addEventListener('DOMContentLoaded', () => {
    // Task checkbox toggle
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('click', () => {
            checkbox.classList.toggle('checked');
            const taskItem = checkbox.closest('.task-item');
            const taskName = taskItem.querySelector('.task-name');
            if (checkbox.classList.contains('checked')) {
                taskName.style.textDecoration = 'line-through';
                taskName.style.opacity = '0.6';
            } else {
                taskName.style.textDecoration = 'none';
                taskName.style.opacity = '1';
            }
        });
    });
    
    // Filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });
});
