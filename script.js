const nonReplyUpperSectionEls = document.querySelectorAll('.non-reply-comment .comment-upper');
const replyUpperSectionEls = document.querySelectorAll('.reply-comment .comment-upper');
const nonReplyText = document.querySelectorAll('.non-reply-comment .comment-text-container');
const replyText = document.querySelectorAll('.reply-comment .comment-text-container');
const allDefaultComments = document.querySelectorAll('.comment');
const createCommentImg = document.querySelector('.create-comment img');
const replyingToEls = document.querySelectorAll('.replying-to');
const replyEl = document.querySelectorAll('.reply');
const mainContainer = document.querySelector('main');
const sendBtnEl = document.querySelector('.send-btn');
const overlayEl = document.querySelector('.overlay');
const deleteModalContainer = document.querySelector('.delete-modal-container');
const firstReplyContainer = document.querySelector('.first-reply-container');
const lastReplyContainer = document.querySelector('.last-reply-container');
const defaultLastComment = document.querySelector('.default-comment-4');
const createCommentContainer = document.querySelector('.create-comment');
const createCommentTextArea = document.querySelector('.create-comment textarea');

const updateCommentText = function (key, uniqueCommentId) {
  // The default comment's text does not use this function to get updated.
  const arr = JSON.parse(localStorage.getItem(key));
  const comment = document.querySelector(`[data-unique-id="${uniqueCommentId}"]`);

  if (arr) {
    arr.forEach((_, i) => {
      if (arr[i].html.includes(uniqueCommentId)) {
        const index = arr.indexOf(arr[i]);
        arr[index].html = comment.outerHTML;
        localStorage.setItem(key, JSON.stringify(arr));
        return;
      }
    });
  }
};

function setProperty(element, propertyName, propertyValue) {
  element.style[propertyName] = propertyValue;
}

const generateUniqueId = function () {
  return Math.random().toString(36).substr(2, 9);
};

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const loadNewCommentsUponRefresh = function (arr, el, location, className) {
  arr.forEach((commentData, i) => {
    const { html, createdTimestamp } = commentData;

    el.insertAdjacentHTML(location, html);

    const newCommentTimestamp = document.querySelectorAll(`.${className} .timestamp`);
    newCommentTimestamp[i].setAttribute('data-created', createdTimestamp.toString());
    updateTimeAgo(newCommentTimestamp[i], createdTimestamp);
  });

  setInterval(updateLoadedCommentTimestamps, 60000, className);
};

const deleteComment = function (key, uniqueCommentId, comment) {
  const arr = JSON.parse(localStorage.getItem(key));
  comment.remove();

  arr.forEach((_, i) => {
    if (arr[i].html.includes(uniqueCommentId)) {
      const index = arr.indexOf(arr[i]);
      arr.splice(index, 1);
      return;
    }
  });

  if (arr.length !== 0) {
    localStorage.setItem(key, JSON.stringify(arr));
  } else localStorage.removeItem(key);

  if (localStorage.getItem(`commentData_${uniqueCommentId}`)) {
    localStorage.removeItem(`commentData_${uniqueCommentId}`);
  }
};

const loadCommentData = function (uniqueCommentId) {
  return (
    JSON.parse(localStorage.getItem(`commentData_${uniqueCommentId}`)) || {
      voteCount: +document.querySelector(`[data-unique-id="${uniqueCommentId}"] .vote-num`).textContent,
      isUpvoted: false,
      isDownvoted: false,
    }
  );
};

const renderCommentChanges = function () {
  const allComments = document.querySelectorAll('.comment');
  allComments.forEach((comment) => {
    const uniqueCommentId = comment.getAttribute('data-unique-id');
    const commentData = loadCommentData(uniqueCommentId);

    updateCommentUI(uniqueCommentId, commentData);
  });
};

function updateTimeAgo(timestampElement, createdTimestamp) {
  const currentTime = new Date();
  const timeDiff = Math.floor((currentTime - createdTimestamp) / 1000);

  if (timeDiff < 60) {
    timestampElement.textContent = 'Just now';
  } else if (timeDiff < 3600) {
    const minutesAgo = Math.floor(timeDiff / 60);
    timestampElement.textContent = minutesAgo + ' minute' + (minutesAgo > 1 ? 's' : '') + ' ago';
  } else if (timeDiff < 86400) {
    const hoursAgo = Math.floor(timeDiff / 3600);
    timestampElement.textContent = hoursAgo + ' hour' + (hoursAgo > 1 ? 's' : '') + ' ago';
  } else {
    const daysAgo = Math.floor(timeDiff / 86400);
    timestampElement.textContent = daysAgo + ' day' + (daysAgo > 1 ? 's' : '') + ' ago';
  }
}

function updateLoadedCommentTimestamps(className) {
  const loadedCommentTimestamps = document.querySelectorAll(`.${className} .timestamp`);
  loadedCommentTimestamps.forEach((timestamp) => {
    const createdTimestamp = parseFloat(timestamp.getAttribute('data-created'));
    updateTimeAgo(timestamp, createdTimestamp);
  });
}

function saveCommentData(uniqueCommentId, data) {
  localStorage.setItem(`commentData_${uniqueCommentId}`, JSON.stringify(data));
}

function updateCommentUI(uniqueCommentId, data) {
  const voteContainer = document.querySelector(`[data-unique-id="${uniqueCommentId}"] .vote-btn-container`);
  const upvoteBtnEl = voteContainer.querySelector('.upvote');
  const downvoteBtnEl = voteContainer.querySelector('.downvote');
  const voteNumEl = voteContainer.querySelector('.vote-num');

  voteNumEl.textContent = data.voteCount;

  upvoteBtnEl.style.fill = data.isUpvoted ? 'hsl(238, 40%, 52%)' : '#C5C6EF';
  downvoteBtnEl.style.fill = data.isDownvoted ? 'hsl(238, 40%, 52%)' : '#C5C6EF';
}

const autoUpvote = function (uniqueCommentId) {
  const commentData = loadCommentData(uniqueCommentId);
  commentData.isUpvoted = !commentData.isUpvoted;
  updateCommentUI(uniqueCommentId, commentData);
  saveCommentData(uniqueCommentId, commentData);
};

function handleVoteClick(e) {
  const voteButton = e.target.closest('.upvote, .downvote');

  if (!voteButton) return;

  const voteContainer = voteButton.closest('.vote-btn-container');
  const initialVoteNum = +voteContainer.getAttribute('data-initial-vote');
  const maxVoteNum = +voteContainer.getAttribute('data-max-vote');
  const lowestVoteNum = +voteContainer.getAttribute('data-lowest-vote');
  const voteNumEl = voteContainer.querySelector('.vote-num');

  const comment = voteContainer.closest('.comment');
  if (!comment) return;

  const uniqueCommentId = comment.getAttribute('data-unique-id');

  const commentData = loadCommentData(uniqueCommentId);

  if (voteButton.classList.contains('upvote')) {
    if (+voteNumEl.textContent < maxVoteNum) {
      commentData.voteCount = maxVoteNum;
    } else if (+voteNumEl.textContent === maxVoteNum) {
      commentData.voteCount = initialVoteNum;
    }

    commentData.isUpvoted = !commentData.isUpvoted;
    commentData.isDownvoted = false;
  }

  if (voteButton.classList.contains('downvote')) {
    if (+voteNumEl.textContent > lowestVoteNum) {
      commentData.voteCount = lowestVoteNum;
    } else if (+voteNumEl.textContent === lowestVoteNum) {
      commentData.voteCount = initialVoteNum;
    }
    commentData.isDownvoted = !commentData.isDownvoted;
    commentData.isUpvoted = false;
  }

  updateCommentUI(uniqueCommentId, commentData);
  saveCommentData(uniqueCommentId, commentData);

  if (!commentData.isDownvoted && !commentData.isUpvoted) {
    localStorage.removeItem(`commentData_${uniqueCommentId}`);
  }
}

mainContainer.addEventListener('click', handleVoteClick);

const renderInitialTimestamps = function (key, className, uniqueCommentId, html) {
  const timestampEl = document.querySelector(`[data-unique-id="${uniqueCommentId}"] .timestamp`);
  const createdTimestamp = new Date().getTime();
  timestampEl.setAttribute('data-created', createdTimestamp.toString());
  updateTimeAgo(timestampEl, createdTimestamp);

  const newCommentData = {
    html,
    createdTimestamp,
  };

  if (key === 'newComment') {
    const existingComments = JSON.parse(localStorage.getItem('newComment')) || [];
    existingComments.push(newCommentData);
    localStorage.setItem('newComment', JSON.stringify(existingComments));
  } else if (key === 'firstPostNewReply') {
    const existingFirstPostReplyComments = JSON.parse(localStorage.getItem('firstPostNewReply')) || [];
    existingFirstPostReplyComments.push(newCommentData);
    localStorage.setItem('firstPostNewReply', JSON.stringify(existingFirstPostReplyComments));
  } else {
    const existingLastPostReplyComments = JSON.parse(localStorage.getItem('lastPostNewReply')) || [];
    existingLastPostReplyComments.push(newCommentData);
    localStorage.setItem('lastPostNewReply', JSON.stringify(existingLastPostReplyComments));
  }
  setInterval(() => {
    const timestamps = document.querySelectorAll(`.${className} .timestamp`);
    timestamps.forEach((timestamp) => {
      const createdTimestamp = parseFloat(timestamp.getAttribute('data-created'));
      console.log(createdTimestamp);
      updateTimeAgo(timestamp, createdTimestamp);
    });
  }, 60000);
};

async function data() {
  const response = await fetch('data.json');
  const result = response.json();

  nonReplyUpperSectionEls.forEach((el, i) => {
    result.then((value) => {
      el.querySelector('img').src = value.comments[i].user.image.png;
      el.querySelector('.username').innerHTML = value.comments[i].user.username;
      el.querySelector('.timestamp').innerHTML = value.comments[i].createdAt;
    });
  });

  nonReplyText.forEach((el, i) => {
    result.then((value) => {
      el.innerHTML = value.comments[i].content;
    });
  });

  replyUpperSectionEls.forEach((el, i) => {
    result.then((value) => {
      el.querySelector('img').src = value.comments[1].replies[i].user.image.png;
      el.querySelector('.username').innerHTML = value.comments[1].replies[i].user.username;
      el.querySelector('.timestamp').innerHTML = value.comments[1].replies[i].createdAt;
    });
  });

  replyText.forEach((el, i) => {
    result.then((value) => {
      replyingToEls[i].innerHTML += value.comments[1].replies[i].replyingTo;
      el.innerHTML += value.comments[1].replies[i].content;
    });
  });

  result.then((value) => {
    createCommentImg.src = value.currentUser.image.png;
  });

  return result;
}

replyEl.forEach((el, i) => {
  el.addEventListener('click', async function () {
    const response = await fetch('data.json');
    const result = await response.json();
    const createNewReply = document.querySelector('.new-reply');
    const uniqueCommentId = generateUniqueId();
    const recipientUsername = allDefaultComments[i].querySelector('.username').innerHTML;
    const allCommentsBtnEls = document.querySelectorAll('.reply, .delete-comment-btn, .edit-comment-btn, .send-btn');

    const replyInputHTML = `
    <div class="new-reply">
      <img class="user-profile" src="${result.currentUser.image.png}">
     <textarea>@${recipientUsername},&nbsp</textarea>          
      <button class="reply-submit-btn">Reply</button>
   </div>`;

    if (!createNewReply) {
      allDefaultComments[i].insertAdjacentHTML('afterend', replyInputHTML);
      setProperty(el, 'opacity', '0.5');
    } else {
      createNewReply.remove();
      setProperty(el, 'opacity', '');
    }

    allCommentsBtnEls.forEach((btn, innerIndex) => {
      setProperty(btn, 'pointerEvents', `${!createNewReply && innerIndex !== i ? 'none' : 'auto'}`);
    });

    const newReplyEls = document.querySelectorAll('.new-reply');
    const replySubmitBtnEls = document.querySelectorAll('.reply-submit-btn');
    const newReplyTextAreaEls = document.querySelectorAll('.new-reply textarea');

    replySubmitBtnEls.forEach((replySubmit, index) => {
      replySubmit.addEventListener('click', function () {
        if (isMobileDevice()) {
          setProperty(replySubmit, 'opacity', '1');
        }
        if (newReplyTextAreaEls[index].value.includes('@' + recipientUsername.trim()) && !(newReplyTextAreaEls[index].value.trim().length > recipientUsername.trim().length + 2)) {
          return;
        }

        if (newReplyTextAreaEls[index].value.trim().length === 0) {
          return;
        }
        allCommentsBtnEls.forEach((btn) => {
          setProperty(btn, 'pointerEvents', 'auto');
        });
        const userReply = newReplyTextAreaEls[index].value.replace(`@${recipientUsername}`, '').trim().replace(',', '');

        newReplyEls[index].remove();
        setProperty(el, 'opacity', '');

        const firstPostNewReplyHTML = `
        <div class="comment reply-comment first-comment-new-reply" data-unique-id=${uniqueCommentId}>
          <div class="vote-btn-container" data-initial-vote="0" data-lowest-vote="-1" data-max-vote="1">
            <svg width="11" height="11" xmlns="http://www.w3.org/2000/svg">
              <path
                class="upvote"
                d="M6.33 10.896c.137 0 .255-.05.354-.149.1-.1.149-.217.149-.354V7.004h3.315c.136 0 .254-.05.354-.149.099-.1.148-.217.148-.354V5.272a.483.483 0 0 0-.148-.354.483.483 0 0 0-.354-.149H6.833V1.4a.483.483 0 0 0-.149-.354.483.483 0 0 0-.354-.149H4.915a.483.483 0 0 0-.354.149c-.1.1-.149.217-.149.354v3.37H1.08a.483.483 0 0 0-.354.15c-.1.099-.149.217-.149.353v1.23c0 .136.05.254.149.353.1.1.217.149.354.149h3.333v3.39c0 .136.05.254.15.353.098.1.216.149.353.149H6.33Z"
                fill="#C5C6EF"
              />
            </svg>
            <p class="vote-num">1</p>
             <svg width="11" height="3" xmlns="http://www.w3.org/2000/svg">
              <path
                class="downvote"
                d="M9.256 2.66c.204 0 .38-.056.53-.167.148-.11.222-.243.222-.396V.722c0-.152-.074-.284-.223-.395a.859.859 0 0 0-.53-.167H.76a.859.859 0 0 0-.53.167C.083.437.009.57.009.722v1.375c0 .153.074.285.223.396a.859.859 0 0 0 .53.167h8.495Z"
                fill="#C5C6EF"
              />
            </svg>
          </div>
          <div class="comment-content">
            <div class="comment-upper">
              <img class="user-profile" src="${result.currentUser.image.png}" alt="" />
                <p class="username">${result.currentUser.username}</p>
                <p class="your-comment-label">you</p>
              <span class="timestamp"></span>
              <div class="comment-btn-container">
                <p class="delete-comment-btn"><img src="images/icon-delete.svg" alt="" />Delete</p>
                <p class="edit-comment-btn"><img src="images/icon-edit.svg" alt="" />Edit</p>
              </div>
            </div>
            <div class="comment-text-container"><span class="replying-to">@${recipientUsername}</span>${userReply}</div>
          </div>
        </div>`;

        const lastPostNewReplyHTML = `
              <div class="comment reply-comment last-comment-new-reply" data-unique-id=${uniqueCommentId}>
          <div class="vote-btn-container" data-initial-vote="0" data-lowest-vote="-1" data-max-vote="1">
            <svg width="11" height="11" xmlns="http://www.w3.org/2000/svg">
              <path
                class="upvote"
                d="M6.33 10.896c.137 0 .255-.05.354-.149.1-.1.149-.217.149-.354V7.004h3.315c.136 0 .254-.05.354-.149.099-.1.148-.217.148-.354V5.272a.483.483 0 0 0-.148-.354.483.483 0 0 0-.354-.149H6.833V1.4a.483.483 0 0 0-.149-.354.483.483 0 0 0-.354-.149H4.915a.483.483 0 0 0-.354.149c-.1.1-.149.217-.149.354v3.37H1.08a.483.483 0 0 0-.354.15c-.1.099-.149.217-.149.353v1.23c0 .136.05.254.149.353.1.1.217.149.354.149h3.333v3.39c0 .136.05.254.15.353.098.1.216.149.353.149H6.33Z"
                fill="#C5C6EF"
              />
            </svg>
            <p class="vote-num">1</p>
             <svg width="11" height="3" xmlns="http://www.w3.org/2000/svg">
              <path
                class="downvote"
                d="M9.256 2.66c.204 0 .38-.056.53-.167.148-.11.222-.243.222-.396V.722c0-.152-.074-.284-.223-.395a.859.859 0 0 0-.53-.167H.76a.859.859 0 0 0-.53.167C.083.437.009.57.009.722v1.375c0 .153.074.285.223.396a.859.859 0 0 0 .53.167h8.495Z"
                fill="#C5C6EF"
              />
            </svg>
          </div>
          <div class="comment-content">
            <div class="comment-upper">
              <img class="user-profile" src="${result.currentUser.image.png}" alt="" />
                <p class="username">${result.currentUser.username}</p>
                <p class="your-comment-label">you</p>
              <span class="timestamp"></span>
              <div class="comment-btn-container">
                <p class="delete-comment-btn"><img src="images/icon-delete.svg" alt="" />Delete</p>
                <p class="edit-comment-btn"><img src="images/icon-edit.svg" alt="" />Edit</p>
              </div>
            </div>
            <div class="comment-text-container"><span class="replying-to">@${recipientUsername}</span>${userReply}</div>
          </div>
        </div>`;

        if (i === 0) {
          setProperty(firstReplyContainer, 'display', 'flex');
          firstReplyContainer.insertAdjacentHTML('beforeend', firstPostNewReplyHTML);
          renderInitialTimestamps('firstPostNewReply', 'first-comment-new-reply', uniqueCommentId, firstPostNewReplyHTML);
          autoUpvote(uniqueCommentId);
        }

        if (i !== 0) {
          lastReplyContainer.insertAdjacentHTML('beforeend', lastPostNewReplyHTML);
          renderInitialTimestamps('lastPostNewReply', 'last-comment-new-reply', uniqueCommentId, lastPostNewReplyHTML);
          autoUpvote(uniqueCommentId);
        }
      });
    });
  });
});

sendBtnEl.addEventListener('click', async function () {
  const response = await fetch('data.json');
  const result = await response.json();
  let username;
  let newMessage;
  const uniqueCommentId = generateUniqueId();

  if (isMobileDevice()) {
    setProperty(sendBtnEl, 'opacity', '1');
  }

  if (!createCommentTextArea.value) {
    return;
  }

  if (createCommentTextArea.value.includes('@')) {
    const firstSpace = createCommentTextArea.value.indexOf(' ');
    username = createCommentTextArea.value.slice(0, firstSpace);
    newMessage = createCommentTextArea.value.slice(firstSpace);
    if (!(createCommentTextArea.value.trim().length > username.trim().length + 1)) return;
  } else {
    username = '';
    newMessage = createCommentTextArea.value;
  }

  const html = `
      <div class="comment non-reply-comment new-comment" data-unique-id=${uniqueCommentId}>
        <div class="vote-btn-container" data-initial-vote="0" data-lowest-vote="-1" data-max-vote="1">
           <svg width="11" height="11" xmlns="http://www.w3.org/2000/svg">
            <path
              class="upvote"
              d="M6.33 10.896c.137 0 .255-.05.354-.149.1-.1.149-.217.149-.354V7.004h3.315c.136 0 .254-.05.354-.149.099-.1.148-.217.148-.354V5.272a.483.483 0 0 0-.148-.354.483.483 0 0 0-.354-.149H6.833V1.4a.483.483 0 0 0-.149-.354.483.483 0 0 0-.354-.149H4.915a.483.483 0 0 0-.354.149c-.1.1-.149.217-.149.354v3.37H1.08a.483.483 0 0 0-.354.15c-.1.099-.149.217-.149.353v1.23c0 .136.05.254.149.353.1.1.217.149.354.149h3.333v3.39c0 .136.05.254.15.353.098.1.216.149.353.149H6.33Z"
              fill="#C5C6EF"
            />
          </svg>
          <p class="vote-num">1</p>
          <svg width="11" height="3" xmlns="http://www.w3.org/2000/svg">
            <path
              class="downvote"
              d="M9.256 2.66c.204 0 .38-.056.53-.167.148-.11.222-.243.222-.396V.722c0-.152-.074-.284-.223-.395a.859.859 0 0 0-.53-.167H.76a.859.859 0 0 0-.53.167C.083.437.009.57.009.722v1.375c0 .153.074.285.223.396a.859.859 0 0 0 .53.167h8.495Z"
              fill="#C5C6EF"
            />
          </svg>
        </div>
        <div class="comment-content">
          <div class="comment-upper">
            <img class="user-profile" src="${result.currentUser.image.png}" alt="" />
              <p class="username">${result.currentUser.username}</p>
              <p class="your-comment-label">you</p>
            <span class="timestamp" data-created></span>
            <div class="comment-btn-container">
              <p class="delete-comment-btn"><img src="images/icon-delete.svg" alt="" />Delete</p>
              <p class="edit-comment-btn"><img src="images/icon-edit.svg" alt="" />Edit</p>
            </div>
          </div>
          <div class="comment-text-container"><span class="replying-to">${username}</span>${newMessage}</div>
        </div>
      </div>`;

  if (createCommentTextArea.value) {
    createCommentContainer.insertAdjacentHTML('beforebegin', html);
    createCommentTextArea.value = '';

    renderInitialTimestamps('newComment', 'new-comment', uniqueCommentId, html);
  }

  autoUpvote(uniqueCommentId);
});

mainContainer.addEventListener('click', function (e) {
  const editEl = e.target.closest('.edit-comment-btn');
  const deleteEl = e.target.closest('.delete-comment-btn');
  const comment = e.target.closest('.comment');

  if (deleteEl) {
    setProperty(overlayEl, 'display', 'flex');
    setProperty(deleteModalContainer, 'display', 'flex');
    deleteModalContainer.setAttribute('data-comment-id', comment.getAttribute('data-unique-id'));
  }
  if (!editEl) return;
  const commentTextContainer = comment.querySelector('.comment-text-container');
  const commentContent = comment.querySelector('.comment-content');
  const replyingToEl = comment.querySelector('.replying-to');

  if (editEl.style.opacity !== '0.5') {
    setProperty(commentTextContainer, 'border', '2px solid #eaecf1');
    setProperty(commentTextContainer, 'borderRadius', '5px');
    setProperty(commentTextContainer, 'padding', '10px');
    commentTextContainer.contentEditable = true;
    setProperty(editEl, 'opacity', '0.5');

    if (replyingToEl) {
      replyingToEl.contentEditable = false;
    }

    let updateBtn = comment.querySelector('.update-btn');
    if (!updateBtn) {
      const createUpdateBtn = document.createElement('button');

      createUpdateBtn.innerText = 'Update';
      createUpdateBtn.className = 'update-btn';
      setProperty(createUpdateBtn, 'display', 'block');
      setProperty(createUpdateBtn, 'marginLeft', 'auto');
      setProperty(createUpdateBtn, 'marginTop', '10px');

      commentContent.appendChild(createUpdateBtn);
      updateBtn = createUpdateBtn;
    }

    const observer = new MutationObserver(() => {
      const isEmpty = !commentTextContainer.textContent;
      const isReplying = replyingToEl.textContent && commentTextContainer.textContent.includes(replyingToEl.textContent.trim());
      const isLengthValid = commentTextContainer.textContent.trim().length <= replyingToEl.textContent.trim().length + 1;

      setProperty(updateBtn, 'pointerEvents', isEmpty || (isReplying && isLengthValid) ? 'none' : 'auto');
    });

    updateBtn.addEventListener('click', function () {
      if (isMobileDevice()) {
        setProperty(updateBtn, 'opacity', '1');
      }
      const uniqueCommentId = comment.getAttribute('data-unique-id');
      setProperty(commentTextContainer, 'border', 'none');
      setProperty(commentTextContainer, 'borderRadius', '0');
      setProperty(commentTextContainer, 'padding', '0');
      commentTextContainer.contentEditable = false;
      updateBtn.remove();
      setProperty(editEl, 'opacity', '');

      if (firstReplyContainer.contains(comment)) {
        updateCommentText('firstPostNewReply', uniqueCommentId);
      }
      if (lastReplyContainer.contains(comment)) {
        updateCommentText('lastPostNewReply', uniqueCommentId);
      }
      if (comment.classList.contains('default-comment-4')) {
        const commentTextContainer = comment.querySelector('.comment-text-container').innerHTML;
        localStorage.setItem('defaultReply', commentTextContainer);
      }
      if (comment.classList.contains('new-comment')) {
        updateCommentText('newComment', uniqueCommentId);
      }
    });
    observer.observe(commentTextContainer, { childList: true, characterData: true, subtree: true });
  } else {
    setProperty(commentTextContainer, 'border', '');
    setProperty(commentTextContainer, 'borderRadius', '');
    setProperty(commentTextContainer, 'padding', '');
    commentTextContainer.contentEditable = false;
    setProperty(editEl, 'opacity', '');
    comment.querySelector('.update-btn').remove();
  }
});

deleteModalContainer.addEventListener('click', function (e) {
  const modalCancelBtn = e.target.closest('.cancel-btn');
  const modalDeleteBtn = e.target.closest('.delete-comment-confirm-btn');

  const commentId = deleteModalContainer.getAttribute('data-comment-id');
  const comment = mainContainer.querySelector(`[data-unique-id="${commentId}"]`);

  if (modalCancelBtn) {
    setProperty(overlayEl, 'display', 'none');
    setProperty(deleteModalContainer, 'display', 'none');
  }

  if (modalDeleteBtn) {
    const uniqueCommentId = comment.getAttribute('data-unique-id');

    if (comment.classList.contains('first-comment-new-reply')) {
      deleteComment('firstPostNewReply', uniqueCommentId, comment);
    } else if (comment.classList.contains('last-comment-new-reply')) {
      deleteComment('lastPostNewReply', uniqueCommentId, comment);
    } else if (uniqueCommentId === 'default-reply-2') {
      comment.remove();
      localStorage.setItem('defaultReplyDeleted', 'true');
      if (localStorage.getItem(`commentData_${uniqueCommentId}`)) {
        localStorage.removeItem(`commentData_${uniqueCommentId}`);
      }

      if (localStorage.getItem('defaultReplyDeleted') === 'true') {
        localStorage.removeItem('defaultReply');
      }
    } else {
      deleteComment('newComment', uniqueCommentId, comment);
    }

    setProperty(overlayEl, 'display', 'none');
    setProperty(deleteModalContainer, 'display', 'none');

    if (!firstReplyContainer.firstElementChild) {
      setProperty(firstReplyContainer, 'display', 'none');
    }
  }
});

window.addEventListener('DOMContentLoaded', async function () {
  await data();

  const existingComments = JSON.parse(localStorage.getItem('newComment')) || [];
  const existingFirstPostReplyComments = JSON.parse(localStorage.getItem('firstPostNewReply')) || [];
  const existingLastPostReplyComments = JSON.parse(localStorage.getItem('lastPostNewReply')) || [];
  const defaultReplyEl = document.querySelector('.default-comment-4');

  if (localStorage.getItem('defaultReplyDeleted') === 'true') {
    defaultReplyEl.remove();
  }

  if (localStorage.getItem('defaultReply')) {
    const lastPostText = defaultLastComment.querySelector('.comment-text-container');
    lastPostText.innerHTML = localStorage.getItem('defaultReply');
  }

  if (existingFirstPostReplyComments.length !== 0) {
    setProperty(firstReplyContainer, 'display', 'flex');
    loadNewCommentsUponRefresh(existingFirstPostReplyComments, firstReplyContainer, 'beforeend', 'first-comment-new-reply');
  }

  if (existingLastPostReplyComments.length !== 0) {
    loadNewCommentsUponRefresh(existingLastPostReplyComments, lastReplyContainer, 'beforeend', 'last-comment-new-reply');
  }

  if (existingComments.length !== 0) {
    loadNewCommentsUponRefresh(existingComments, createCommentContainer, 'beforebegin', 'new-comment');
  }

  renderCommentChanges();
});
