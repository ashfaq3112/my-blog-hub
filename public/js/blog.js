document.addEventListener("DOMContentLoaded", () => {
  const postId = document.body.getAttribute("data-post-id");
  const commentList = document.getElementById("commentList");
  const commentForm = document.getElementById("commentForm");

  // ---------------- ADD COMMENT ----------------
  if (commentForm) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = document.getElementById("commentInput").value.trim();
      if (!text) return;

      try {
        const res = await fetch(`/comments/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.success) {
          addCommentToDOM(data.comment);
          commentForm.reset();
        }
      } catch (err) {
        console.error("❌ Add comment failed:", err);
      }
    });
  }

  function addCommentToDOM(comment) {
    const item = document.createElement("li");
    item.className = "list-group-item";
    item.id = `comment-${comment._id}`;
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>
            ${comment.user.profilepic ? `<img src="/images/uploads/${comment.user.profilepic}" class="rounded-circle me-2" style="width:30px;height:30px;object-fit:cover;">` : ""}
            ${comment.user.name}
          </strong>
          : <span class="comment-text">${comment.text}</span>
          <br>
          <small class="text-muted">${new Date(comment.createdAt).toDateString()}</small>
        </div>
        ${comment.isOwner ? `
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="toggleEditForm('${comment._id}')">Edit</button>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteComment('${comment._id}')">Delete</button>
          </div>` : ""}
      </div>
      <form id="edit-form-${comment._id}" class="mt-2 d-none">
        <div class="input-group">
          <input type="text" name="text" value="${comment.text}" class="form-control" required>
          <button class="btn btn-success btn-sm">Save</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="toggleEditForm('${comment._id}')">Cancel</button>
        </div>
      </form>
    `;
    commentList.prepend(item);
    document.getElementById("commentCount").textContent =
      parseInt(document.getElementById("commentCount").textContent) + 1;
  }

  // ---------------- TOGGLE EDIT FORM ----------------
  window.toggleEditForm = (id) => {
    const form = document.getElementById(`edit-form-${id}`);
    form.classList.toggle("d-none");
  };

  // ---------------- EDIT COMMENT (Event Delegation) ----------------
  commentList.addEventListener("submit", async (e) => {
    if (!e.target.matches("form[id^='edit-form-']")) return;

    e.preventDefault();
    const id = e.target.id.replace("edit-form-", "");
    const newText = e.target.querySelector("input[name='text']").value.trim();
    if (!newText) return;

    try {
      const res = await fetch(`/comments/edit/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText })
      });
      const data = await res.json();
      if (data.success) {
        document.querySelector(`#comment-${id} .comment-text`).textContent = newText;
        toggleEditForm(id);
      }
    } catch (err) {
      console.error("❌ Edit comment failed:", err);
    }
  });

  // ---------------- DELETE COMMENT ----------------
  window.deleteComment = async (id) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`/comments/delete/${id}`, {
        method: "POST",
        headers: { "Accept": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById(`comment-${id}`).remove();
        document.getElementById("commentCount").textContent =
          parseInt(document.getElementById("commentCount").textContent) - 1;
      }
    } catch (err) {
      console.error("❌ Delete comment failed:", err);
    }
  };
});

const likeBtn = document.getElementById("likeBtn");
if (likeBtn) {
  likeBtn.addEventListener("click", async () => {
    const postId = document.body.getAttribute("data-post-id");

    try {
      const res = await fetch(`/blogs/like/${postId}`, {
        method: "POST",
        headers: { "Accept": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        // Update the count
        document.getElementById("likeCount").textContent = data.likes;

        // Optional: toggle button style for liked/unliked
        if (data.liked) {
          likeBtn.classList.add("btn-danger");
          likeBtn.classList.remove("btn-outline-danger");
        } else {
          likeBtn.classList.add("btn-outline-danger");
          likeBtn.classList.remove("btn-danger");
        }
      }
    } catch (err) {
      console.error("❌ Like failed:", err);
    }
  });
}

// follow/unfollow functionality
const followBtn = document.getElementById("followBtn"); 
if(followBtn) {
  followBtn.addEventListener("click", async () => {
    const userId = document.body.getAttribute("data-user-id");

    try {
      const res = await fetch(`/user/follow/${userId}`, {
        method: "POST",
        headers: { "Accept": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        // Update the button text and style
        followBtn.textContent = data.following ? "Unfollow" : "Follow";
        followBtn.classList.toggle("btn-primary");
        followBtn.classList.toggle("btn-outline-primary");
      }
    } catch (err) {
      console.error("❌ Follow/Unfollow failed:", err);
    }
  });
}
