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