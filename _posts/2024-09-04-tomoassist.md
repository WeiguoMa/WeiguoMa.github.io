---
layout: research_post
title: "Tomography-assisted noisy quantum circuit simulation using matrix product density operators"
date: 2024-09-04
category: research
status: "Published (Phys. Rev. A 110, 032604)"
online_web: https://doi.org/10.1103/PhysRevA.110.032604
arxiv_link: https://doi.org/10.48550/arXiv.2508.07610
code_link: https://github.com/WeiguoMa/Tomography-assisted-MPDO-QCircuit
tags: [Noisy Quantum Simulator, Tensor Networks]

abstract: >
  In recent years, efficient quantum circuit simulations incorporating ideal noise assumptions have relied on tensor
  network simulators, particularly leveraging the matrix product density operator (MPDO) framework. However, experiments
  on real noisy intermediate-scale quantum (NISQ) devices often involve complex noise profiles, encompassing uncontrollable
  elements and instrument-specific effects such as crosstalk. To address these challenges, we employ quantum process
  tomography (QPT) techniques to directly capture the operational characteristics of the experimental setup and integrate
  them into numerical simulations using MPDOs. Our QPT-assisted MPDO simulator is then applied to explore a variational approach
  for generating noisy entangled states, comparing the results with standard noise numerical simulations and demonstrations
  conducted on the Quafu cloud quantum computation platform. Additionally, we investigate noisy MaxCut problems, as well
  as the effects of crosstalk and noise truncation. Our results provide valuable insights into the impact of noise on NISQ
  devices and lay the foundation for enhanced design and assessment of quantum algorithms in complex noise environments.
---

<h2 class="section-title">sub title</h2>


![insert a figure]({{ '/assets/posts/2024-09-04-tomoAssist/figures/somefigure.png' | relative_url }})
