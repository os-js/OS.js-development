# OS.js Development Packages

This repository contains Development packages for [OS.js](https://github.com/os-js/OS.js).

Follow [the official instructions](https://os.js.org/doc/manuals/man-package-manager.html) on how to add this repository.

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/os-js/OS.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Tips](https://img.shields.io/gratipay/os-js.svg)](https://gratipay.com/os-js/)
[![Donate](https://img.shields.io/badge/paypal-donate-yellow.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=andersevenrud%40gmail%2ecom&lc=NO&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
[![Support](https://img.shields.io/badge/patreon-support-orange.svg)](https://www.patreon.com/user?u=2978551&ty=h&u=2978551)

## IDE

This is my second attempt at creating a Interface Designer and IDE for OS.js.

*Last time I actually deleted my entire work (which was almost complete) by accident... And I did not commit it anywhere*... yeah!

![ScreenShot](https://raw.githubusercontent.com/os-js/OS.js-development/master/doc/ide.png)

#### Status

In progress, basic interface designing works. You can create, save and load projects.

**Does not work properly in firefox due to a [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=568313) in the browser**

#### TODO

* [ ] Menu Editor
* [ ] Dropdown Editor
* [ ] Add all elements and correct properties
* [ ] Adding of files

**BUGS**

* [ ] Current tab gets unselected on UI change
* [ ] Update className on metadata change (**do not change this one at the moment, name your project correctly from the start**)
* [ ] https://bugzilla.mozilla.org/show_bug.cgi?id=568313

#### How to use

Just select `File -> New` to create a new project. It will be saved in `home:///.packages/ProjectName`.

You can drag-and drop elements from the pallette into the designer window, then edit the properties in the property window. You can also re-arrange elements in the property window tree by dragging-and-dropping (dropping on a container will insert at the end, dropping on a container element will make it insert before).

If you click an element twice you will select the parent element.

Every time you save the project the package manager will be updated so you can run your app from the `Launcher Menu`.
