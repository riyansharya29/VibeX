import { useNavigate } from 'react-router-dom'
import { EmptyState, Button } from '../components/ui'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="page">
      <EmptyState icon="compass" title="Lost in the vibes (404)"
        body="That page doesn’t exist — maybe it moved, or the link is off.">
        <Button variant="primary" onClick={() => navigate('/')}>Take me home</Button>
        <Button variant="soft" onClick={() => navigate(-1)}>Go back</Button>
      </EmptyState>
    </div>
  )
}
