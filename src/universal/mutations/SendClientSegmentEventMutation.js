import {getRequest} from 'relay-runtime'

const mutation = graphql`
  mutation SendClientSegmentEventMutation($event: String!, $options: SegmentEventTrackOptions) {
    segmentEventTrack(event: $event, options: $options)
  }
`

const SendClientSegmentEventMutation = (atmosphere, event, options) => {
  const {_network: network} = atmosphere
  network.execute(getRequest(mutation), {event, options}, {force: true})
}

export default SendClientSegmentEventMutation
