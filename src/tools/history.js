/**
 * cd-list History api
 */
function normalizeBase (base) {
  if (!base) {
    const baseEl = document.querySelector('base')
    base = baseEl ? baseEl.getAttribute('href') : '/'
  }

  if (base[0] !== '/') {
    base = '/' + base
  }

  return base;
}

export default class History {

  go () {
    throw 'need implemented'
  }

  push () {
    throw 'need implemented'
  }

  replace () {
    throw 'need implemented'
  }

  constructor (base = '/', option) {
    option = option || {};

    this.base = normalizeBase(base)

    if (option.disableHistory) {
      this.canHistory = false;
    } else {
      this.canHistory = !!window.history.pushState
    }
  }

  listen (cb = ()=>{}) {
    this.cb = cb
  }
}
