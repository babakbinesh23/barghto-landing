/* ============================================================
   برقتو — منطق ماشین‌حساب، FAQ، اعتبارسنجی فرم و شمارنده آمار
   ============================================================
   ضرایب تخمینی — قابل ویرایش. مقادیر واقعی بازار را اینجا به‌روزرسانی کنید.
*/
const CONFIG = {
  // ساعت تولید معادل سالانه به ازای هر کیلووات ظرفیت (kWh در سال به ازای هر kW)
  SPECIFIC_YIELD: {
    ongrid: 1600, // آنگرید
    hybrid: 1450  // هیبرید (بخشی از انرژی صرف ذخیره/مصرف می‌شود)
  },
  // نرخ خرید تضمینی دولت (ریال به ازای هر کیلووات‌ساعت)
  GUARANTEED_RATE: 4000,
  // ضریب افزایش درآمد در فروش از طریق برقتو نسبت به خرید تضمینی
  BARGHTO_UPLIFT: 1.35
};

// ------- ابزار اعداد فارسی -------
const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function toFa(str) {
  return String(str).replace(/\d/g, d => faDigits[d]);
}
function formatNumber(n) {
  return toFa(Math.round(n).toLocaleString('en-US'));
}
function formatToman(rials) {
  const toman = rials / 10;
  return formatNumber(toman) + ' تومان';
}

// ------- ماشین‌حساب -------
const calcForm = document.getElementById('calc-form');
if (calcForm) {
  calcForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const rawCapacity = parseFloat(document.getElementById('capacity').value);
    const unit = document.getElementById('capacity-unit').value;
    const type = document.getElementById('plant-type').value;

    if (!rawCapacity || rawCapacity <= 0) {
      document.getElementById('capacity').classList.add('invalid');
      document.getElementById('capacity').focus();
      return;
    }
    document.getElementById('capacity').classList.remove('invalid');

    // تبدیل به کیلووات
    const capacityKw = unit === 'mw' ? rawCapacity * 1000 : rawCapacity;

    const yieldPerKw = CONFIG.SPECIFIC_YIELD[type] || CONFIG.SPECIFIC_YIELD.ongrid;
    const annualProduction = capacityKw * yieldPerKw;             // kWh در سال
    const guaranteedIncome = annualProduction * CONFIG.GUARANTEED_RATE;
    const barghtoIncome = guaranteedIncome * CONFIG.BARGHTO_UPLIFT;
    const diff = barghtoIncome - guaranteedIncome;

    document.getElementById('r-production').textContent = formatNumber(annualProduction);
    document.getElementById('r-guaranteed').textContent = formatToman(guaranteedIncome);
    document.getElementById('r-barghto').textContent = formatToman(barghtoIncome);
    document.getElementById('r-diff').textContent = '+ ' + formatToman(diff);
  });
}

// ------- آکاردئون FAQ -------
document.querySelectorAll('.faq-q').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const item = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-a');
    const isOpen = item.classList.contains('open');

    // بستن بقیه
    document.querySelectorAll('.faq-item.open').forEach(function (other) {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-a').style.maxHeight = null;
      }
    });

    if (isOpen) {
      item.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = null;
    } else {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// ------- اعتبارسنجی فرم بررسی -------
const lead = document.getElementById('lead');
if (lead) {
  const mobileRegex = /^09\d{9}$/;

  function setError(id, msg) {
    const field = document.getElementById(id);
    const errEl = lead.querySelector('.error[data-for="' + id + '"]');
    if (msg) {
      field.classList.add('invalid');
      if (errEl) errEl.textContent = msg;
    } else {
      field.classList.remove('invalid');
      if (errEl) errEl.textContent = '';
    }
  }

  // تبدیل ارقام فارسی/عربی به لاتین برای اعتبارسنجی موبایل
  function normalizeDigits(s) {
    return s.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
            .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  }

  lead.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('l-name').value.trim();
    if (name.length < 2) { setError('l-name', 'نام را وارد کنید.'); valid = false; }
    else setError('l-name', '');

    const mobile = normalizeDigits(document.getElementById('l-mobile').value.trim());
    if (!mobileRegex.test(mobile)) { setError('l-mobile', 'شماره موبایل معتبر وارد کنید (۰۹xxxxxxxxx).'); valid = false; }
    else setError('l-mobile', '');

    const capacity = parseFloat(normalizeDigits(document.getElementById('l-capacity').value));
    if (!capacity || capacity <= 0) { setError('l-capacity', 'ظرفیت نیروگاه را وارد کنید.'); valid = false; }
    else setError('l-capacity', '');

    const province = document.getElementById('l-province').value;
    if (!province) { setError('l-province', 'استان را انتخاب کنید.'); valid = false; }
    else setError('l-province', '');

    const status = document.getElementById('l-status').value;
    if (!status) { setError('l-status', 'وضعیت نیروگاه را انتخاب کنید.'); valid = false; }
    else setError('l-status', '');

    if (valid) {
      lead.querySelectorAll('input, select, button').forEach(el => el.setAttribute('disabled', 'disabled'));
      document.getElementById('lead-success').hidden = false;
      document.getElementById('lead-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// ------- شمارنده کارت‌های آمار -------
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    el.textContent = toFa(current.toLocaleString('en-US')) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statNumbers = document.querySelectorAll('.stat-number');
if (statNumbers.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(el => observer.observe(el));
} else {
  statNumbers.forEach(animateCounter);
}
