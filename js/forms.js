// Validación y manejo de formularios

import { CONFIG } from './constants.js';
import { showConfirmationScreen } from './modals.js';

/**
 * Valida un formulario
 */
export function validateForm(formElement) {
  const errors = [];

  // Validar nombre
  const name = formElement.querySelector('[name="name"]')?.value.trim();
  if (!name || name.length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  // Validar Instagram
  const instagram = formElement.querySelector('[name="instagram"]')?.value.trim();
  if (!instagram || !instagram.startsWith('@')) {
    errors.push('Instagram debe empezar con @');
  }
  if (instagram && instagram.length < 3) {
    errors.push('Instagram debe tener al menos 3 caracteres');
  }

  // Validar materia
  const subject = formElement.querySelector('[name="subject"]')?.value.trim();
  if (!subject) {
    errors.push('Debes seleccionar una materia');
  }

  // Validar descripción
  const description = formElement.querySelector('[name="description"]')?.value.trim();
  if (!description || description.length < 10) {
    errors.push('La descripción debe tener al menos 10 caracteres');
  }

  // Validar fecha de entrega (si existe)
  const deadline = formElement.querySelector('[name="deadline"]')?.value;
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    if (deadlineDate <= today) {
      errors.push('La fecha de entrega debe ser en el futuro');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Muestra errores de validación en el formulario
 */
export function showValidationErrors(formElement, errors) {
  // Limpiar errores previos
  document.querySelectorAll('.form-error').forEach((el) => el.remove());

  if (errors.length === 0) return;

  // Crear contenedor de errores
  let errorContainer = formElement.querySelector('.error-messages');
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'error-messages';
    formElement.insertBefore(errorContainer, formElement.firstChild);
  }

  errorContainer.innerHTML = errors
    .map((error) => `<div class="error-message">❌ ${error}</div>`)
    .join('');
}

/**
 * Limpia los mensajes de error
 */
export function clearValidationErrors(formElement) {
  const errorContainer = formElement.querySelector('.error-messages');
  if (errorContainer) {
    errorContainer.remove();
  }
}

/**
 * Prepara los datos del formulario para enviar
 */
export function getFormData(formElement) {
  const formData = new FormData(formElement);
  const data = {
    name: formData.get('name'),
    instagram: formData.get('instagram'),
    subject: formData.get('subject'),
    price: formData.get('price'),
    description: formData.get('description'),
    deadline: formData.get('deadline') || '',
    additional_notes: formData.get('additional_notes') || '',
  };

  return data;
}

/**
 * Envía los datos del formulario al backend
 */
export async function submitForm(formElement) {
  // Validar
  const validation = validateForm(formElement);

  if (!validation.isValid) {
    showValidationErrors(formElement, validation.errors);
    return false;
  }

  clearValidationErrors(formElement);

  // Mostrar loading
  const submitBtn = formElement.querySelector('[type="submit"]');
  const originalText = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Enviando...';
  }

  try {
    // Preparar datos
    const data = getFormData(formElement);

    // Enviar al backend (por ahora simular)
    // TODO: Reemplazar con llamada real al backend en Fase 2
    console.log('Datos del formulario:', data);

    // Simular respuesta exitosa
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mostrar confirmación
    showConfirmationScreen();
    formElement.reset();

    return true;
  } catch (error) {
    console.error('Error al enviar formulario:', error);
    showValidationErrors(formElement, ['Error al enviar el formulario. Intenta nuevamente.']);
    return false;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

/**
 * Inicializa todos los formularios
 */
export function initializeForms() {
  // Formulario de solicitud de tarea
  const requestForm = document.querySelector('#requestModal form');
  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(requestForm);
    });
  }

  // Formulario de cotización personalizada
  const customQuoteForm = document.querySelector('#customQuoteModal form');
  if (customQuoteForm) {
    customQuoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitForm(customQuoteForm);
    });
  }

  // Limpiar errores cuando el usuario empieza a escribir
  document.querySelectorAll('input, textarea, select').forEach((field) => {
    field.addEventListener('input', () => {
      const form = field.closest('form');
      if (form) {
        clearValidationErrors(form);
      }
    });
  });
}
