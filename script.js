let sideNavbar = document.querySelector('.side-nav');
let selectedSection = document.querySelector('.selected-section');
let backLink = document.querySelector('.back-link');

backLink.addEventListener('click', function() {
  let dashboard = backLink.getAttribute('href');
  console.log(dashboard);
  for (let i = 0; i < sideNavbar.children.length; i++) {
    if  (sideNavbar.children[i].getAttribute('href') === dashboard) {
      sideNavbar.children[i].classList.add('selected-section');
    } else {
      sideNavbar.children[i].classList.remove('selected-section');
    }
    sectionVisibility();
  }
});

for (let i = 0; i < sideNavbar.children.length; i++) {
  sideNavbar.children[i].addEventListener('click', function() {
    for (let j = 0; j < sideNavbar.children.length; j++) {
      sideNavbar.children[j].classList.remove('selected-section');
    }
    this.classList.add('selected-section');
    sectionVisibility();
  });
}

let sectionVisibility = () => {
  for (let i = 0; i < sideNavbar.children.length; i++){
    if (sideNavbar.children[i].classList.contains('selected-section')) {
      sectionElement = document.querySelector(`${sideNavbar.children[i].getAttribute('href')}`);
      console.log(sectionElement);
      sectionElement.classList.remove('invisible-page');
      sectionElement.classList.add('visible-page');
    } else {
      document.querySelector(`${sideNavbar.children[i].getAttribute('href')}`).classList.remove('visible-page');
      document.querySelector(`${sideNavbar.children[i].getAttribute('href')}`).classList.add('invisible-page');
    }
  }
}

sectionVisibility();

