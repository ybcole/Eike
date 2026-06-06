const menuItems = document.querySelectorAll('.menu-item');

menuItems.forEach(item => {
  item.addEventListener('mouseenter', () => {
    menuItems.forEach(el => el.classList.remove('active'));
    item.classList.add('active');
  });

  item.addEventListener('mouseleave', () => {
    item.classList.remove('active');
  });

  item.addEventListener('click', (e) => {
    // Don't collapse when interacting with any expand panel
    if (e.target.closest('.menu-expand') || e.target.closest('.rc-expand')) return;
    const isOpen = item.classList.contains('open');
    menuItems.forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});