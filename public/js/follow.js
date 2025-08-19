document.addEventListener("DOMContentLoaded", function () {
  const followBtn = document.getElementById("followBtn");

  if (followBtn) {
    followBtn.addEventListener("click", function () {
      const userId = this.getAttribute("data-user-id");

      fetch(`/user/follow/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // ✅ Toggle button state
            this.classList.toggle("btn-primary");
            this.classList.toggle("btn-outline-primary");
            this.textContent = data.action === "follow" ? "Unfollow" : "Follow";

            // ✅ Update follower/following counts dynamically
            const followersCount = document.getElementById("followersCount");
            const followingCount = document.getElementById("followingCount");

            if (followersCount) followersCount.textContent = data.followersCount;
            // if (followingCount) followingCount.textContent = data.followingCount;
          } else {
            alert(data.message || "Something went wrong");
          }
        })
        .catch(err => console.error("Error:", err));
    });
  }
});
