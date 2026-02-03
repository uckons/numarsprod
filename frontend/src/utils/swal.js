import Swal from "sweetalert2"

const defaultTheme = {
  background: "#111",
  color: "#fff",
  confirmButtonColor: "#c9a24d",
  cancelButtonColor: "#666"
}

export const SwalSuccess = (title, text, timer = 1500) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer,
    showConfirmButton: false,
    ...defaultTheme
  })
}

export const SwalError = (title, text) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    ...defaultTheme
  })
}

export const SwalWarning = (title, text) => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    ...defaultTheme
  })
}

export const SwalConfirm = (title, text, confirmText = "Yes", cancelText = "Cancel") => {
  return Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    ...defaultTheme
  })
}

export const SwalLoading = (title = "Processing...", text = "Please wait") => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading()
    },
    ...defaultTheme
  })
}

export const SwalDelete = (itemName) => {
  // Security Note: Using 'text' property instead of 'html' ensures SweetAlert2
  // automatically escapes the content, preventing XSS even with user-controlled itemName
  return Swal.fire({
    title: "Delete Confirmation",
    text: `Are you sure you want to delete ${itemName}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#666",
    background: "#111",
    color: "#fff"
  })
}
