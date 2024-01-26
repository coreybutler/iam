import Component from './Component.js'

export default class Mapping extends Component {
  constructor (config) {
    super({ type: 'Mapping', ...config })
  }
}