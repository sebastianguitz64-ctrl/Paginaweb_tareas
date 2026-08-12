// Lógica de modales y gestión de ventanas emergentes

import { CONFIG, SUBJECTS } from './constants.js';

/**
 * Abre un modal
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Cierra un modal
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Cierra un modal al hacer click fuera de él
 */
export function setupModalBackdropClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modalId);
    }
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal(modalId);
    }
  });
}

/**
 * Configura botones de cerrar modal
 */
export function setupCloseButtons() {
  document.querySelectorAll('.modal-close, [data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = btn.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
}

/**
 * Abre el modal de solicitud y pre-llena la materia
 */
export function openRequestModal(subject) {
  const modal = document.getElementById('requestModal');
  if (!modal) return;

  // Pre-llenar la materia
  const subjectInput = modal.querySelector('[name="subject"]');
  if (subjectInput) {
    subjectInput.value = subject;
  }

  // Actualizar precio
  updatePriceDisplay(subject);

  openModal('requestModal');
}

/**
 * Actualiza el precio mostrado en el formulario
 */
export function updatePriceDisplay(subject) {
  const priceEl = document.getElementById('priceDisplay');
  const subjectData = SUBJECTS[subject.toLowerCase().replace('á', 'a')];

  if (priceEl && subjectData) {
    if (subjectData.variable) {
      priceEl.textContent = `Q${subjectData.priceMin} – Q${subjectData.priceMax}`;
    } else {
      priceEl.textContent = `Q${subjectData.price}`;
    }
  }
}

/**
 * Abre modal de cotización personalizada
 */
export function openCustomQuoteModal() {
  openModal('customQuoteModal');
}

/**
 * Muestra pantalla de confirmación
 */
export function showConfirmationScreen() {
  openModal('confirmationModal');
}

/**
 * Cierra confirmación y resetea
 */
export function closeConfirmation() {
  closeModal('confirmationModal');
  // Resetear formulario si es necesario
  const form = document.querySelector('#requestModal form');
  if (form) form.reset();
}

/**
 * Abre Instagram en nueva ventana
 */
export function openInstagram() {
  window.open(CONFIG.instagram, '_blank', 'noopener,noreferrer');
}

/**
 * Inicializa todos los modales
 */
export function initializeModals() {
  setupCloseButtons();

  // Setup para todos los modales
  ['requestModal', 'customQuoteModal', 'confirmationModal'].forEach((modalId) => {
    setupModalBackdropClose(modalId);
  });

  // Event listeners para "Solicitar" en tarjetas
  document.querySelectorAll('.solicitar').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.price-card');
      const subject = card?.getAttribute('data-subject');
      if (subject) {
        openRequestModal(subject);
      }
    });
  });

  // Botones de Instagram
  document.querySelectorAll('[data-instagram-link]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openInstagram();
    });
  });
}
