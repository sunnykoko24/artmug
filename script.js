const slider = document.getElementById('portfolioSlider');
const tabButtons = document.querySelectorAll('.tab-btn');
const works = document.querySelectorAll('.work');

function visibleCards() {
  return [...works].filter(card => !card.hidden);
}

function slidePortfolio(direction) {
  const card = visibleCards()[0];
  if (!card) return;
  const gap = 12;
  slider.scrollBy({
    left: direction * (card.getBoundingClientRect().width + gap),
    behavior: 'smooth'
  });
}

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;

    works.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });

    slider.scrollTo({left: 0, behavior: 'smooth'});
  });
});

function openBenefitPreview() {
  const modal = document.getElementById('benefitPreview');
  const button = document.querySelector('.preview-btn');
  if (!modal || !button) return;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  // 긴 iframe에서도 버튼을 누른 위치의 중앙에 오도록 실제 팝업 높이로 계산합니다.
  requestAnimationFrame(() => {
    const buttonRect = button.getBoundingClientRect();
    const buttonCenterY = buttonRect.top + window.pageYOffset + (buttonRect.height / 2);
    const modalHeight = modal.getBoundingClientRect().height;
    const pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const maxTop = Math.max(12, pageHeight - modalHeight - 12);
    const preferredTop = Math.min(maxTop, Math.max(12, buttonCenterY - (modalHeight / 2)));
    modal.style.top = `${preferredTop}px`;
  });
}

function closeBenefitPreview(event) {
  const modal = document.getElementById('benefitPreview');
  if (!modal) return;
  const clickedClose = event?.target?.closest?.('.image-modal-close');
  if (event && event.target !== modal && !clickedClose) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const modal = document.getElementById('benefitPreview');
    if (modal && modal.classList.contains('open')) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }
});



function selectDiscord(button){
  const group = document.getElementById('application-discord-choice');
  if (!group) return;

  group.querySelectorAll('button').forEach(item => {
    item.classList.toggle('active', item === button);
  });

  const hidden = document.getElementById('application-discord');
  if (hidden) hidden.value = button.dataset.value || '';
}

function copyApplicationForm(button){
  const fields = [
    ['1. 주문하실 작업명', 'application-work'],
    ['2. 방송국 링크 + 방송닉네임', 'application-channel'],
    ['3. 컨셉 또는 참고 이미지', 'application-concept'],
    ['4. 사용하실 파츠 링크', 'application-parts'],
    ['5. 디스코드 사용 여부 (O / X)', 'application-discord'],
    ['6. 추가 문의사항', 'application-extra']
  ];

  const text = fields.map(([label, id]) => {
    const element = document.getElementById(id);
    const value = element ? element.value.trim() : '';
    return label + '\n' + (value || '');
  }).join('\n\n');

  const done = () => {
    const original = button.textContent;
    button.textContent = '복사 완료!';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = original;
      button.classList.remove('copied');
    }, 1600);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, callback){
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const copied = document.execCommand('copy');
    if (copied) callback();
    else throw new Error('copy failed');
  } catch (error) {
    alert('복사에 실패했습니다. 입력 내용을 직접 선택해 복사해주세요.');
  }
  document.body.removeChild(textarea);
}

// 이미지 확대 및 썸네일 슬라이더
(() => {
  const lightbox = document.getElementById('siteLightbox');
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-image');
  const caption = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  const thumbs = lightbox.querySelector('.lightbox-thumbs');

  let currentGroup = [];
  let currentIndex = 0;
  let touchStartX = 0;

  const getZoomableImages = () =>
    [...document.querySelectorAll('img.zoomable-image')].filter(img => {
      const card = img.closest('.work');
      return !card || !card.hidden;
    });


  function isGifImage(img) {
    const src = (img.currentSrc || img.src || '').toLowerCase();
    return src.includes('image/gif') || src.split('?')[0].endsWith('.gif');
  }

  function isAllPortfolioTabActive() {
    const active = document.querySelector('.tab-btn.active');
    if (!active) return true;

    const value = String(
      active.dataset.filter ||
      active.dataset.category ||
      active.getAttribute('data-tab') ||
      active.textContent.trim()
    ).toLowerCase();

    return value === 'all' ||
           value === '전체' ||
           active.textContent.trim() === '전체';
  }

  function openLightbox(clickedImg) {
    const groupName = clickedImg.dataset.lightboxGroup || 'default';
    const clickedCard = clickedImg.closest('.work');
    const clickedCategory = clickedCard ? clickedCard.dataset.category : '';

    const showAllCategories = groupName === 'portfolio' && isAllPortfolioTabActive();

    currentGroup = getZoomableImages().filter(img => {
      const sameGroup = (img.dataset.lightboxGroup || 'default') === groupName;
      const card = img.closest('.work');
      const category = card ? card.dataset.category : '';

      if (!sameGroup) return false;
      if (showAllCategories) return true;

      return !clickedCategory || category === clickedCategory;
    });

    currentIndex = Math.max(0, currentGroup.indexOf(clickedImg));
    renderThumbnails();

    const card = clickedImg.closest('.work');
    const category = card ? card.dataset.category : '';
    lightbox.classList.toggle('shape-mode', category === 'shape');
    lightbox.classList.toggle('gif-mode', isGifImage(clickedImg));

    updateLightbox();

    const rect = clickedImg.getBoundingClientRect();
    const imageCenterY = rect.top + window.pageYOffset + (rect.height / 2);

    // 아트머그 iframe은 매우 길게 잡혀 있어서 fixed 중앙 정렬을 쓰면
    // iframe 전체의 중간으로 이동합니다.
    // 따라서 클릭한 이미지의 중심을 기준으로 확대창 중심을 맞춥니다.
    const viewerHeight = window.matchMedia('(max-width:760px)').matches ? 500 : 620;
    const preferredTop = Math.max(12, imageCenterY - (viewerHeight / 2));

    lightbox.style.top = preferredTop + 'px';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-lock');
  }

  function updateLightbox() {
    const target = currentGroup[currentIndex];
    if (!target) return;

    const card = target.closest('.work');
    const category = card ? card.dataset.category : '';
    const titleEl = card ? card.querySelector('.work-info b') : null;
    let title = titleEl ? titleEl.textContent.trim() : (target.alt || '');

    lightbox.classList.toggle('shape-mode', category === 'shape');
    lightbox.classList.toggle('gif-mode', isGifImage(target));

    if (category === 'complete') {
      title = title
        .replace(/\s*완성작\s*$/,'')
        .replace(/개인작\s+(\d+)/g,'개인작$1');
      title += ' 완성작 포트폴리오';
    } else if (category === 'shape') {
      title = title.replace(/\s*성형\s*$/,'');
      title += ' 성형 포트폴리오';
    }

    lightboxImg.classList.remove('image-changing');
    void lightboxImg.offsetWidth;
    lightboxImg.src = target.currentSrc || target.src;
    lightboxImg.alt = title;
    lightboxImg.classList.add('image-changing');
    caption.textContent = title;

    const multiple = currentGroup.length > 1;
    prevBtn.style.display = multiple ? '' : 'none';
    nextBtn.style.display = multiple ? '' : 'none';
    thumbs.style.display = multiple ? 'flex' : 'none';
    syncActiveThumbnail();
  }

  function drawStaticGifThumbnail(canvas, src) {
    const ctx = canvas.getContext('2d');
    const image = new Image();

    image.onload = () => {
      const canvasRatio = canvas.width / canvas.height;
      const imageRatio = image.naturalWidth / image.naturalHeight;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;

      /* object-fit: cover와 같은 방식으로 중앙 크롭 */
      if (imageRatio > canvasRatio) {
        sourceWidth = image.naturalHeight * canvasRatio;
        sourceX = (image.naturalWidth - sourceWidth) / 2;
      } else {
        sourceHeight = image.naturalWidth / canvasRatio;
        sourceY = (image.naturalHeight - sourceHeight) / 2;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    image.onerror = () => {
      ctx.fillStyle = '#fff4bd';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#4f410d';
      ctx.font = '700 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GIF', canvas.width / 2, canvas.height / 2);
    };

    image.src = src;
  }

  function renderThumbnails() {
    thumbs.innerHTML = '';

    currentGroup.forEach((img, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lightbox-thumb';
      button.setAttribute('aria-label', img.alt || `포트폴리오 이미지 ${index + 1}`);

      if (isGifImage(img)) button.classList.add('is-gif');

      if (isGifImage(img)) {
        const canvas = document.createElement('canvas');
        canvas.className = 'lightbox-gif-static-canvas';
        canvas.width = 124;
        canvas.height = 124;
        button.appendChild(canvas);
        drawStaticGifThumbnail(canvas, img.currentSrc || img.src);
      } else {
        const thumbImg = document.createElement('img');
        thumbImg.src = img.currentSrc || img.src;
        thumbImg.alt = '';
        thumbImg.loading = 'lazy';
        button.appendChild(thumbImg);
      }
      button.addEventListener('click', event => {
        event.stopPropagation();
        currentIndex = index;
        updateLightbox();
      });

      thumbs.appendChild(button);
    });
  }

  function syncActiveThumbnail() {
    const buttons = [...thumbs.querySelectorAll('.lightbox-thumb')];

    buttons.forEach((button, index) => {
      const active = index === currentIndex;
      button.classList.toggle('active', active);
      if (active) {
        /* scrollIntoView는 모바일에서 바깥 페이지까지 좌우로 움직일 수 있어
           썸네일 영역 내부의 scrollLeft만 변경합니다. */
        const targetLeft = button.offsetLeft - ((thumbs.clientWidth - button.offsetWidth) / 2);
        thumbs.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: 'smooth'
        });
      }
    });
  }

  function move(direction) {
    if (!currentGroup.length) return;
    currentIndex = (currentIndex + direction + currentGroup.length) % currentGroup.length;
    updateLightbox();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-lock');
    lightboxImg.removeAttribute('src');
    lightbox.classList.remove('gif-mode', 'complete-mode', 'shape-mode');
    thumbs.innerHTML = '';
  }

  document.addEventListener('click', event => {
    const img = event.target.closest('img.zoomable-image');
    if (img) {
      openLightbox(img);
      return;
    }

    if (event.target === lightbox) closeLightbox();
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', event => {
    event.stopPropagation();
    move(-1);
  });
  nextBtn.addEventListener('click', event => {
    event.stopPropagation();
    move(1);
  });

  document.addEventListener('keydown', event => {
    if (!lightbox.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });

  lightbox.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive:true });

  lightbox.addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 45) return;
    move(delta > 0 ? -1 : 1);
  }, { passive:true });

  let wheelLocked = false;
  lightbox.addEventListener('wheel', event => {
    if (!lightbox.classList.contains('open')) return;
    if (event.target.closest('.lightbox-thumbs')) return;
    if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;

    event.preventDefault();
    if (wheelLocked) return;

    wheelLocked = true;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;

    move(delta > 0 ? 1 : -1);
    window.setTimeout(() => {
      wheelLocked = false;
    }, 260);
  }, { passive:false });

})();

(() => {
  const grid = document.querySelector('.portfolio-grid');
  const tabButtons = [...document.querySelectorAll('.tab-btn')];
  if (!grid || !tabButtons.length) return;

  function getFilterValue(button) {
    return button.dataset.filter ||
           button.dataset.category ||
           button.getAttribute('data-tab') ||
           button.textContent.trim();
  }

  function syncPortfolioDividers(button) {
    const value = String(getFilterValue(button) || '').toLowerCase();
    const isAll =
      value === 'all' ||
      value === '전체' ||
      button.textContent.trim() === '전체';

    grid.classList.toggle('filtered-view', !isAll);

    document.querySelectorAll('.portfolio-divider').forEach(divider => {
      divider.hidden = !isAll;
    });
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      window.setTimeout(() => syncPortfolioDividers(button), 0);
    });
  });

  const activeButton = document.querySelector('.tab-btn.active') || tabButtons[0];
  syncPortfolioDividers(activeButton);
})();
