export function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = crypto.randomUUID(); // or use nanoid
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}