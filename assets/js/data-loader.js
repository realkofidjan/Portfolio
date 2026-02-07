/**
 * data-loader.js
 * Fetches profile.json and blog.json, then populates all HTML pages.
 * Hardcoded HTML serves as fallback if JSON fails to load.
 */
(function () {
  'use strict';

  // Detect base path for GitHub Pages project sites (username.github.io/repo/)
  // Works with both root hosting and subdirectory hosting
  var scripts = document.getElementsByTagName('script');
  var basePath = '';
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].getAttribute('src') || '';
    if (src.indexOf('data-loader.js') !== -1) {
      // data-loader.js is at assets/js/data-loader.js
      // so base is two levels up from the script
      basePath = src.replace('assets/js/data-loader.js', '');
      break;
    }
  }

  function fetchJSON(url) {
    return fetch(basePath + url)
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  function setHTML(id, html) {
    var el = document.getElementById(id);
    if (el && html) el.innerHTML = html;
  }

  // ── Years of experience (calculated from experienceStartYear) ──
  function updateYearsOfExperience(startYear) {
    var el = document.getElementById('years-exp');
    if (!el || !startYear) return;
    var years = Math.max(1, new Date().getFullYear() - startYear);
    el.textContent = years < 10 ? '0' + years : years;
  }

  // ── Profile data populators ──

  function populateIndex(p) {
    setText('index-tagline', p.headline);
    setText('index-name', p.name + '.');
    // Truncate bio to 10 words with ellipsis on index page
    if (p.about) {
      var words = p.about.split(/\s+/);
      var truncated = words.length > 10 ? words.slice(0, 10).join(' ') + '...' : words.join(' ');
      setText('index-bio', truncated);
    }
    updateYearsOfExperience(p.experienceStartYear);
  }

  function populateAbout(p) {
    setText('about-name', p.name);
    setText('about-bio', p.about);

    // Experience list
    var expEl = document.getElementById('about-experience-list');
    if (expEl && p.experience && p.experience.length) {
      var html = '';
      // Show top 2 most recent
      var items = p.experience.slice(0, 2);
      items.forEach(function (exp) {
        html += '<li>' +
          '<p class="date">' + escapeHTML(exp.date) + '</p>' +
          '<h2>' + escapeHTML(exp.title) + '</h2>' +
          '<p class="type">' + escapeHTML(exp.company) + '</p>' +
          '</li>';
      });
      expEl.innerHTML = html;
    }

    // Education list
    var eduEl = document.getElementById('about-education-list');
    if (eduEl && p.education && p.education.length) {
      var html = '';
      p.education.forEach(function (edu) {
        html += '<li>' +
          '<p class="date">' + escapeHTML(edu.date) + '</p>' +
          '<h2>' + escapeHTML(edu.degree) + '</h2>' +
          '<p class="type">' + escapeHTML(edu.institution) + '</p>' +
          '</li>';
      });
      eduEl.innerHTML = html;
    }
  }

  function populateCredentials(p) {
    setText('cred-name', p.name);
    setText('cred-handle', '@' + (p.name || '').toLowerCase().replace(/\s+/g, ''));
    setText('cred-about-1', p.about);

    // Experience
    var expEl = document.getElementById('cred-experience-list');
    if (expEl && p.experience && p.experience.length) {
      var html = '';
      p.experience.forEach(function (exp) {
        html += '<div class="credential-edc-exp-item" data-aos="zoom-in">' +
          '<h4>' + escapeHTML(exp.date) + '</h4>' +
          '<h3>' + escapeHTML(exp.title) + '</h3>' +
          '<h5>' + escapeHTML(exp.company) + '</h5>' +
          '<p>' + escapeHTML(exp.description) + '</p>' +
          '</div>';
      });
      expEl.innerHTML = html;
    }

    // Education
    var eduEl = document.getElementById('cred-education-list');
    if (eduEl && p.education && p.education.length) {
      var html = '';
      p.education.forEach(function (edu) {
        html += '<div class="credential-edc-exp-item" data-aos="zoom-in">' +
          '<h4>' + escapeHTML(edu.date) + '</h4>' +
          '<h3>' + escapeHTML(edu.degree) + '</h3>' +
          '<h5>' + escapeHTML(edu.institution) + '</h5>' +
          '<p>' + escapeHTML(edu.description) + '</p>' +
          '</div>';
      });
      eduEl.innerHTML = html;
    }
  }

  function populateContact(p) {
    setText('contact-email', p.email || '');
    setText('contact-phone', p.phone || '');
    setText('contact-location', p.location || '');
  }

  // ── Blog populators ──

  function populateBlogList(posts) {
    var container = document.getElementById('blog-items-list');
    if (!container || !posts || !posts.length) return;

    var html = '';
    posts.forEach(function (post) {
      html += '<div class="blog-item" data-aos="zoom-in">';
      if (post.image) {
        html += '<div class="img-box"><img src="' + escapeAttr(basePath + post.image) + '" alt="Blog"></div>';
      }
      html += '<div class="content">' +
        '<span class="meta">' + escapeHTML(post.date) + ' - ' + escapeHTML(post.category) + '</span>' +
        '<h1><a href="blog-details.html?id=' + escapeAttr(post.id) + '">' + escapeHTML(post.title) + '</a></h1>' +
        '<p>' + escapeHTML(post.excerpt) + '</p>' +
        '<a href="blog-details.html?id=' + escapeAttr(post.id) + '" class="theme-btn">Read More</a>' +
        '</div></div>';
    });
    container.innerHTML = html;

    // Update sidebar recent posts
    var recentEl = document.getElementById('blog-recent-posts');
    if (recentEl) {
      var recentHTML = '';
      posts.slice(0, 3).forEach(function (post) {
        recentHTML += '<li><a href="blog-details.html?id=' + escapeAttr(post.id) + '">' + escapeHTML(post.title) + '</a></li>';
      });
      recentEl.innerHTML = recentHTML;
    }
  }

  function populateBlogDetails(posts) {
    var params = new URLSearchParams(window.location.search);
    var postId = params.get('id');

    // Find the post; if no id param, show the first post
    var post = null;
    if (postId) {
      for (var i = 0; i < posts.length; i++) {
        if (posts[i].id === postId) { post = posts[i]; break; }
      }
    }
    if (!post && posts.length) post = posts[0];
    if (!post) return;

    // Update page title
    document.title = post.title + ' - Nana Kofi Djan';

    var detailEl = document.getElementById('blog-detail-content');
    if (!detailEl) return;

    var html = '';

    // Image (only if present)
    if (post.image) {
      html += '<div class="img-box"><img src="' + escapeAttr(basePath + post.image) + '" alt="Blog"></div>';
    }

    html += '<span class="meta">' + escapeHTML(post.date) + ' - ' + escapeHTML(post.category) + '</span>';
    html += '<h1>' + escapeHTML(post.title) + '</h1>';

    // Content paragraphs
    if (post.content && post.content.length) {
      post.content.forEach(function (para) {
        html += '<p>' + escapeHTML(para) + '</p>';
      });
    }

    // Bullet points
    if (post.bullets && post.bullets.length) {
      html += '<ul class="list">';
      post.bullets.forEach(function (b) {
        html += '<li>- ' + escapeHTML(b) + '</li>';
      });
      html += '</ul>';
    }

    // Closing paragraph
    if (post.closing) {
      html += '<p>' + escapeHTML(post.closing) + '</p>';
    }

    // Tags
    if (post.tags && post.tags.length) {
      html += '<div class="tags">';
      post.tags.forEach(function (tag) {
        html += '<a href="#" class="theme-btn">' + escapeHTML(tag) + '</a>';
      });
      html += '</div>';
    }

    detailEl.innerHTML = html;

    // Update sidebar recent posts
    var recentEl = document.getElementById('blog-recent-posts');
    if (recentEl) {
      var recentHTML = '';
      posts.slice(0, 3).forEach(function (p) {
        recentHTML += '<li><a href="blog-details.html?id=' + escapeAttr(p.id) + '">' + escapeHTML(p.title) + '</a></li>';
      });
      recentEl.innerHTML = recentHTML;
    }
  }

  // ── Utilities ──

  function escapeHTML(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHTML(str).replace(/"/g, '&quot;');
  }

  function refreshAOS() {
    if (typeof AOS !== 'undefined' && AOS.refresh) {
      AOS.refresh();
    }
  }

  // ── Detect which page we're on and load appropriate data ──

  var page = window.location.pathname.split('/').pop() || 'index.html';

  // Pages that need profile data
  var profilePages = ['index.html', 'about.html', 'credentials.html', 'contact.html', ''];

  // Pages that need blog data
  var blogPages = ['blog.html', 'blog-details.html'];

  var needsProfile = profilePages.indexOf(page) !== -1;
  var needsBlog = blogPages.indexOf(page) !== -1;

  var promises = [];

  if (needsProfile) {
    promises.push(
      fetchJSON('data/profile.json')
        .then(function (profile) {
          if (page === 'index.html' || page === '') populateIndex(profile);
          if (page === 'about.html') populateAbout(profile);
          if (page === 'credentials.html') populateCredentials(profile);
          if (page === 'contact.html') populateContact(profile);
        })
        .catch(function (err) {
          console.warn('data-loader: Could not load profile.json, using HTML fallback.', err);
        })
    );
  }

  if (needsBlog) {
    promises.push(
      fetchJSON('data/blog.json')
        .then(function (posts) {
          if (page === 'blog.html') populateBlogList(posts);
          if (page === 'blog-details.html') populateBlogDetails(posts);
        })
        .catch(function (err) {
          console.warn('data-loader: Could not load blog.json, using HTML fallback.', err);
        })
    );
  }

  // ── GitHub Projects (works.html) ──

  var githubConfig = {
    username: 'realkofidjan',
    extraRepos: ['Ashesi-Org/ATTA'],
    excludeRepos: ['realkofidjan', 'Portfolio'],
    excludeForks: true
  };

  var languageCategoryMap = {
    'JavaScript': 'WEB DEVELOPMENT',
    'TypeScript': 'WEB DEVELOPMENT',
    'Python': 'PYTHON DEVELOPMENT',
    'Java': 'JAVA APPLICATION',
    'HTML': 'HTML / CSS',
    'CSS': 'HTML / CSS',
    'C++': 'C++ DEVELOPMENT',
    'C': 'C DEVELOPMENT',
    'Dart': 'MOBILE DEVELOPMENT',
    'Kotlin': 'MOBILE DEVELOPMENT',
    'Swift': 'MOBILE DEVELOPMENT'
  };

  function repoToTitle(name) {
    var full = name.replace(/[-_]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    var words = full.split(/\s+/);
    return words.length > 2 ? words.slice(0, 2).join(' ') + '...' : full;
  }

  function loadCoverImage(repo, imgDiv, img) {
    var fullName = repo.full_name;
    var branch = repo.default_branch || 'main';
    var rawUrl = 'https://raw.githubusercontent.com/' + fullName + '/' + branch + '/cover.jpg';
    var testImg = new Image();
    testImg.onload = function () { img.src = rawUrl; };
    testImg.onerror = function () { imgDiv.style.display = 'none'; };
    testImg.src = rawUrl;
  }

  function renderProjects(repos) {
    var container = document.getElementById('projects-list');
    if (!container) return;
    container.innerHTML = '';

    // Build rows of 2
    for (var i = 0; i < repos.length; i += 2) {
      var rowDiv = document.createElement('div');
      rowDiv.className = 'd-flex align-items-start gap-24';

      for (var j = i; j < Math.min(i + 2, repos.length); j++) {
        var repo = repos[j];
        var category = languageCategoryMap[repo.language] || 'SOFTWARE DEVELOPMENT';
        var title = repoToTitle(repo.name);
        var url = repo.html_url;

        var wrapper = document.createElement('div');
        wrapper.className = 'flex-1';

        var card = document.createElement('div');
        card.className = 'project-item shadow-box';

        var overlayLink = document.createElement('a');
        overlayLink.className = 'overlay-link';
        overlayLink.href = url;
        overlayLink.target = '_blank';

        var bgImg = document.createElement('img');
        bgImg.src = 'assets/images/bg1.png';
        bgImg.alt = 'BG';
        bgImg.className = 'bg-img';

        var imgDiv = document.createElement('div');
        imgDiv.className = 'project-img';
        var img = document.createElement('img');
        img.alt = 'Project';
        imgDiv.appendChild(img);

        loadCoverImage(repo, imgDiv, img);

        var infoRow = document.createElement('div');
        infoRow.className = 'd-flex align-items-center justify-content-between';

        var infoDiv = document.createElement('div');
        infoDiv.className = 'project-info';
        var pTag = document.createElement('p');
        pTag.textContent = category;
        var h1Tag = document.createElement('h1');
        h1Tag.textContent = title;
        infoDiv.appendChild(pTag);
        infoDiv.appendChild(h1Tag);

        var btnLink = document.createElement('a');
        btnLink.href = url;
        btnLink.target = '_blank';
        btnLink.className = 'project-btn';
        var btnImg = document.createElement('img');
        btnImg.src = 'assets/images/icon.svg';
        btnImg.alt = 'Button';
        btnLink.appendChild(btnImg);

        infoRow.appendChild(infoDiv);
        infoRow.appendChild(btnLink);

        card.appendChild(overlayLink);
        card.appendChild(bgImg);
        card.appendChild(imgDiv);
        card.appendChild(infoRow);
        wrapper.appendChild(card);
        rowDiv.appendChild(wrapper);
      }

      container.appendChild(rowDiv);
    }

    refreshAOS();
  }

  if (page === 'works.html') {
    var userUrl = 'https://api.github.com/users/' + githubConfig.username + '/repos?per_page=100&sort=updated';

    var fetchPromises = [
      fetch(userUrl).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
    ];

    githubConfig.extraRepos.forEach(function (repoPath) {
      fetchPromises.push(
        fetch('https://api.github.com/repos/' + repoPath).then(function (res) {
          if (!res.ok) throw new Error(res.status);
          return res.json();
        }).then(function (repo) { return [repo]; })
      );
    });

    Promise.all(fetchPromises)
      .then(function (results) {
        var allRepos = [];
        results.forEach(function (r) { allRepos = allRepos.concat(r); });

        // Deduplicate by full_name
        var seen = {};
        allRepos = allRepos.filter(function (r) {
          if (seen[r.full_name]) return false;
          seen[r.full_name] = true;
          return true;
        });

        // Filter
        allRepos = allRepos.filter(function (r) {
          if (githubConfig.excludeForks && r.fork) return false;
          if (githubConfig.excludeRepos.indexOf(r.name) !== -1) return false;
          return true;
        });

        // Sort by updated_at descending
        allRepos.sort(function (a, b) {
          return new Date(b.updated_at) - new Date(a.updated_at);
        });

        renderProjects(allRepos);
      })
      .catch(function (err) {
        console.warn('data-loader: Could not load GitHub repos.', err);
        var container = document.getElementById('projects-list');
        if (container) container.innerHTML = '<p class="text-center">Could not load projects. Please try again later.</p>';
      });
  }

  if (promises.length) {
    Promise.all(promises).then(refreshAOS);
  }

})();
