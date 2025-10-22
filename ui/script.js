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
                alert(Opening project: ${projectName});
            }
        });
    });
});

function setupDragAndDrop() {
    let draggedElement = null;
    const draggables = document.querySelectorAll('[draggable="true"]');
    const dropZones = document.querySelectorAll('.kanban-column');
    
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            draggedElement = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        });
        
        draggable.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(zone, e.clientY);
            if (afterElement == null) {
                zone.appendChild(draggedElement);
            } else {
                zone.insertBefore(draggedElement, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', setupDragAndDrop);
