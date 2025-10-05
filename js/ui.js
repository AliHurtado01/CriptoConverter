
export const UI = {
  toast(title, text = "", icon = "success", timer = 1800) {
    return Swal.fire({
      title,
      text,
      icon,
      timer,
      showConfirmButton: false,
      toast: true,
      position: "top-end",
    });
  },
  confirm(title, text, icon = "question") {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "Cancelar",
    });
  },
  modal(title, html) {
    return Swal.fire({
      title,
      html,
      width: "720px",
      confirmButtonText: "Cerrar",
    });
  },
  error(text) {
    return this.toast("Error", text, "error", 2200);
  },
};
