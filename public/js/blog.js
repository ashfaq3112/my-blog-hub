document.addEventListener("DOMContentLoaded", () => {
  // Get all relevant elements from the DOM
  const postId = document.body.getAttribute("data-post-id");
  const postUserId = document.body.getAttribute("data-user-id");
  const commentList = document.getElementById("commentList");
  const commentForm = document.getElementById("commentForm");
  const likeBtn = document.getElementById("likeBtn");
  const followBtn = document.getElementById("followBtn");

  // ---------------- LIKE BUTTON ----------------
  const handleLike = async () => {
    try {
      const response = await fetch(`/blogs/like/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to like post.");

      const data = await response.json();
      const likeCount = data.likes;
      
      if (likeBtn.textContent.includes("Unlike")) {
        likeBtn.innerHTML = `❤️ Like (<span id="likeCount">${likeCount}</span>)`;
        likeBtn.classList.remove("bg-gradient-to-r", "from-red-600", "to-pink-600");
        likeBtn.classList.add("glass", "hover:bg-white/20");
      } else {
        likeBtn.innerHTML = `❤️ Unlike (<span id="likeCount">${likeCount}</span>)`;
        likeBtn.classList.remove("glass", "hover:bg-white/20");
        likeBtn.classList.add("bg-gradient-to-r", "from-red-600", "to-pink-600");
      }
    } catch (err) {
      console.error("❌ Like failed:", err);
    }
  };

  if (likeBtn) {
    likeBtn.addEventListener("click", handleLike);
  }

  // ---------------- FOLLOW BUTTON ----------------
  const handleFollow = async () => {
    try {
      const response = await fetch(`/user/follow/${postUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to follow user.");

      const data = await response.json();
      if (data.action === "unfollow") {
        followBtn.textContent = "Follow";
        followBtn.classList.remove("bg-gradient-to-r", "from-blue-600", "to-purple-600");
        followBtn.classList.add("glass", "hover:bg-white/20");
      } else if (data.action === "follow") {
        followBtn.textContent = "Unfollow";
        followBtn.classList.remove("glass", "hover:bg-white/20");
        followBtn.classList.add("bg-gradient-to-r", "from-blue-600", "to-purple-600");
      }
    } catch (err) {
      console.error("❌ Follow failed:", err);
    }
  };

  if (followBtn) {
    followBtn.addEventListener("click", handleFollow);
  }

  // ---------------- COMMENTS LOGIC ----------------
  const updateCommentCount = (change) => {
    const el = document.getElementById("commentCount");
    if (el) el.textContent = parseInt(el.textContent) + change;
  };

  const addCommentToDOM = (comment) => {
    const li = document.createElement("li");
    li.id = `comment-${comment._id}`;
    li.className = "glass p-6 rounded-2xl";
    li.setAttribute("data-aos", "fade-up");
    li.setAttribute("data-aos-delay", "100");

    li.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <strong class="flex items-center space-x-2">
            ${comment.user.profilepic ? `<img src="/images/uploads/${comment.user.profilepic}" class="w-8 h-8 rounded-full object-cover border border-purple-400">` : ''}
            <span class="text-blue-400 hover:underline font-semibold">${comment.user.name}</span>
          </strong>
          <p class="comment-text text-gray-300 mt-2">${comment.text}</p>
          <small class="text-gray-500 text-xs">${new Date(comment.createdAt).toDateString()}</small>
        </div>
        ${comment.isOwner ? `
          <div class="flex space-x-2">
            <button type="button" class="edit-comment-btn px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg text-gray-300 transition-colors">Edit</button>
            <button type="button" class="delete-comment-btn px-3 py-1 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors">Delete</button>
          </div>` : ''}
      </div>

      <form class="edit-form mt-4 hidden space-x-2">
        <input type="text" name="text" value="${comment.text}" class="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600" required>
        <button class="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm">Save</button>
        <button type="button" class="cancel-edit-btn px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm">Cancel</button>
      </form>
    `;

    commentList.prepend(li);
    updateCommentCount(1);
  };

  // Add Comment
  if (commentForm) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("commentInput");
      const text = input.value.trim();
      if (!text) return;
      
      try {
        const res = await fetch(`/comments/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data.success) {
          addCommentToDOM(data.comment);
          commentForm.reset();
        } else {
          alert(data.message || "Failed to add comment");
        }
      } catch (err) {
        console.error("❌ Add comment failed:", err);
      }
    });
  }

  // Use event delegation for Edit/Delete/Save/Cancel buttons
  if (commentList) {
    commentList.addEventListener("click", async (e) => {
      const li = e.target.closest("li");
      const id = li.id.replace("comment-", "");

      // Toggle Edit Form
      if (e.target.matches(".edit-comment-btn, .cancel-edit-btn")) {
        const form = li.querySelector(".edit-form");
        form.classList.toggle("hidden");
      }

      // Delete Comment
      if (e.target.matches(".delete-comment-btn")) {
        if (confirm("Are you sure you want to delete this comment?")) {
          try {
            const res = await fetch(`/comments/delete/${id}`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
              li.remove();
              updateCommentCount(-1);
            } else {
              alert(data.message || "Failed to delete comment");
            }
          } catch (err) {
            console.error("❌ Delete failed:", err);
          }
        }
      }
    });

    // Edit Comment (using form submission)
    commentList.addEventListener("submit", async (e) => {
      if (e.target.matches(".edit-form")) {
        e.preventDefault();
        const li = e.target.closest("li");
        const id = li.id.replace("comment-", "");
        const newText = e.target.querySelector("input[name='text']").value.trim();
        if (!newText) return;

        try {
          const res = await fetch(`/comments/edit/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: newText }),
          });
          const data = await res.json();
          if (data.success) {
            li.querySelector(".comment-text").textContent = newText;
            li.querySelector(".edit-form").classList.add("hidden");
          } else {
            alert(data.message || "Failed to edit comment");
          }
        } catch (err) {
          console.error("❌ Edit failed:", err);
        }
      }
    });
  }
});