# release-card examples

Real cards generated from the latest release of each project, with its brand color.

| Project | Command | Card |
| :--- | :--- | :--- |
| **Fonoster** | `/ps:release-card --color fonoster-green --logo Fonoster` | ![Fonoster v0.17.1](./fonoster-green.png) |
| **QCobro** | `/ps:release-card --color fonoster-green --logo QCobro --max 9` | ![QCobro main](./qcobro-green.png) |
| **Mikro** | `/ps:release-card --color fonoster-blue --logo Mikro` | ![Mikro v1.14.3](./mikro-blue.png) |
| **Goodtok** | `/ps:release-card --color fonoster-orange --logo Goodtok` | ![Goodtok v0.1.18](./goodtok-orange.png) |

> QCobro has no tagged release yet, so its card is built from recent `main`
> commits and labeled `main (dev)`; `--max 9` trims the 30-commit list with a
> "+N more commits" line.
