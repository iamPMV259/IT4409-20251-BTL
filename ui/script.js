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