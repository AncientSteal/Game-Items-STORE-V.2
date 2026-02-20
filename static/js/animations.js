document.addEventListener('DOMContentLoaded', () => {
    const options = {
        threshold: 0.1
    };

    window.productObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('show');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, options);

    document.querySelectorAll('.product-card').forEach(card => {
        window.productObserver.observe(card);
    });
});
