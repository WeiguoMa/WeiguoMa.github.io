---
layout: default
title: Blog
permalink: /blog/
pagination:
  enabled: true
  collection: posts
  per_page: 5
  permalink: /blog/page/:num/
---

<div class="posts">
  {%- for post in paginator.posts -%}
    <article class="post">
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y-%m-%d" }}</time>
      <p>{{ post.excerpt | strip_html | truncate: 160 }}</p>
    </article>
    <hr>
  {%- endfor -%}
</div>

{%- if paginator.total_pages > 1 -%}
<nav class="pagination" aria-label="Pagination">
  {%- if paginator.previous_page -%}
    <a href="{{ paginator.previous_page_path | relative_url }}">&laquo; Newer</a>
  {%- endif -%}
  <span>Page {{ paginator.page }} / {{ paginator.total_pages }}</span>
  {%- if paginator.next_page -%}
    <a href="{{ paginator.next_page_path | relative_url }}">Older &raquo;</a>
  {%- endif -%}
</nav>
{%- endif -%}
