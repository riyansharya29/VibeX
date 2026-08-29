import { Component } from 'react'
import Icon from '../lib/icons'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { err: null }
  }
  static getDerivedStateFromError(err) {
    return { err }
  }
  componentDidCatch(err, info) {
    console.error('App error:', err, info)
  }
  render() {
    if (this.state.err) {
      return (
        <div className="empty err" style={{ minHeight: '60dvh' }} role="alert">
          <div className="empty-icon"><Icon name="refresh" size={34} /></div>
          <h3>Something broke on our side</h3>
          <p>{String(this.state.err?.message || 'Unexpected error')}</p>
          <div className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={() => this.setState({ err: null })}>Try again</button>
            <button type="button" className="btn btn-soft" onClick={() => location.assign('/')}>Go home</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
