# WebSocket Server Scaling Guide

Best practices for scaling the Droppio WebSocket overlay server.

## Current Architecture (MVP)

```
Blockchain Event → Single Backend Instance → WebSocket Clients
```

- Single backend instance
- In-memory connection storage
- Direct WebSocket connections
- Suitable for MVP (< 1000 concurrent connections)

## Scaling Phases

### Phase 1: Multiple Instances with Sticky Sessions

**When**: 1000-5000 concurrent connections

**Architecture**:
```
Load Balancer (Sticky Sessions)
  ├── Backend Instance 1 → WebSocket Clients (Creator A)
  ├── Backend Instance 2 → WebSocket Clients (Creator B)
  └── Backend Instance 3 → WebSocket Clients (Creator C)
```

**Implementation**:

1. **Enable Sticky Sessions**
   - Render: Enable in service settings
   - Use session-based routing
   - Route same client to same instance

2. **Connection Affinity**
   ```typescript
   // Use creatorId for routing
   // Same creator always routes to same instance
   const instanceId = hashCreatorId(creatorId) % instanceCount;
   ```

3. **Limitations**:
   - Requires sticky sessions
   - Uneven load distribution possible
   - Instance failures disconnect clients

**Configuration**:
- Render: Enable "Sticky Sessions" in service settings
- Use IP-based or cookie-based affinity
- Monitor connection distribution

### Phase 2: Redis Pub/Sub (Post-MVP)

**When**: 5000+ concurrent connections, need horizontal scaling

**Architecture**:
```
Blockchain Event → Backend Instance 1 → Redis Pub/Sub
                                        ↓
                    All Backend Instances Subscribe
                                        ↓
                    Each Instance → Connected Clients
```

**Implementation**:

1. **Event Publishing**
   ```typescript
   // In blockchain-listener.service.ts
   await redis.publish(
     `creator:${creatorId}`,
     JSON.stringify(tipEvent)
   );
   ```

2. **Event Subscription**
   ```typescript
   // In each backend instance
   redis.subscribe(`creator:${creatorId}`, (message) => {
     // Send to connected WebSocket clients
     sendToClients(creatorId, JSON.parse(message));
   });
   ```

3. **Benefits**:
   - No sticky sessions needed
   - True horizontal scaling
   - Event distribution across instances
   - Better fault tolerance

**Configuration**:
- Use Redis Pub/Sub channels: `creator:{creatorId}`
- Subscribe to channels on instance startup
- Unsubscribe on instance shutdown

### Phase 3: Dedicated WebSocket Layer

**When**: 10,000+ concurrent connections

**Architecture**:
```
Blockchain Event → Backend API → Redis Pub/Sub
                                        ↓
                    WebSocket Layer (Multiple Instances)
                                        ↓
                    Connected Clients
```

**Implementation**:
- Separate WebSocket servers from API servers
- API servers handle HTTP requests
- WebSocket servers handle connections only
- Communicate via Redis Pub/Sub

## Monitoring Metrics

### Key Metrics to Track

1. **Connection Metrics**
   - Active WebSocket connections per instance
   - Connection rate (connections/second)
   - Disconnection rate
   - Average connection duration

2. **Performance Metrics**
   - Event latency (blockchain → client)
   - Message delivery rate
   - Failed message deliveries
   - WebSocket ping/pong latency

3. **Resource Metrics**
   - CPU usage per instance
   - Memory usage per instance
   - Network bandwidth
   - Redis Pub/Sub throughput

### Implementation

**Add Metrics Endpoint**:
```typescript
// GET /metrics
app.get('/metrics', (req, res) => {
  res.json({
    connections: {
      total: wsManager.getTotalConnections(),
      byCreator: wsManager.getConnectionsByCreator(),
    },
    performance: {
      avgLatency: getAvgLatency(),
      messageRate: getMessageRate(),
    },
    resources: {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
    },
  });
});
```

**Monitoring Tools**:
- Prometheus + Grafana
- Datadog
- New Relic
- Custom dashboard

## Load Testing

### Test Scenarios

1. **Connection Load**
   - Test: 1000 concurrent connections
   - Measure: Connection success rate, latency
   - Target: > 99% success, < 100ms latency

2. **Event Throughput**
   - Test: 100 events/second
   - Measure: Delivery latency, success rate
   - Target: < 500ms latency, > 99% delivery

3. **Scaling Test**
   - Test: Gradually increase connections
   - Measure: When to add instances
   - Target: Scale before 80% capacity

### Tools

- **k6**: Load testing framework
- **Artillery**: WebSocket load testing
- **WebSocket King**: Browser-based testing

## Best Practices

### 1. Connection Management

- **Heartbeat**: Ping every 30 seconds
- **Timeout**: Close dead connections after 60 seconds
- **Reconnection**: Client auto-reconnects with exponential backoff
- **Cleanup**: Remove closed connections immediately

### 2. Event Distribution

- **Channel-based**: Use Redis channels per creator
- **Filtering**: Only subscribe to relevant channels
- **Batching**: Batch multiple events when possible
- **Prioritization**: Prioritize live stream events

### 3. Error Handling

- **Graceful Degradation**: Continue on non-critical errors
- **Retry Logic**: Retry failed message deliveries
- **Circuit Breaker**: Stop sending if Redis fails
- **Fallback**: Use polling if WebSocket fails

### 4. Resource Management

- **Connection Limits**: Set max connections per instance
- **Memory Limits**: Monitor memory usage
- **CPU Limits**: Scale before hitting limits
- **Network Limits**: Monitor bandwidth usage

## Scaling Checklist

### Before Scaling

- [ ] Monitor current metrics for 1 week
- [ ] Identify bottlenecks
- [ ] Set scaling thresholds
- [ ] Prepare scaling plan
- [ ] Test scaling process

### During Scaling

- [ ] Add instances gradually
- [ ] Monitor metrics closely
- [ ] Verify load distribution
- [ ] Check error rates
- [ ] Validate event delivery

### After Scaling

- [ ] Verify performance improvements
- [ ] Monitor for 24-48 hours
- [ ] Adjust scaling thresholds
- [ ] Document learnings
- [ ] Update runbooks

## Cost Considerations

### Render Pricing (Example)

- **Starter Plan**: $7/month per instance
- **Professional Plan**: $25/month per instance
- **Redis**: $10/month per instance

### Scaling Costs

- **Phase 1** (3 instances): ~$31/month
- **Phase 2** (5 instances + Redis): ~$45/month
- **Phase 3** (10 instances + Redis): ~$80/month

### Optimization

- Use auto-scaling based on metrics
- Scale down during low traffic
- Use reserved instances for production
- Monitor and optimize Redis usage

## Troubleshooting

### High Connection Failures

- Check instance capacity
- Verify load balancer configuration
- Check network connectivity
- Review error logs

### Event Delivery Delays

- Check Redis Pub/Sub latency
- Verify instance CPU/memory
- Review network bandwidth
- Check message queue depth

### Uneven Load Distribution

- Review sticky session configuration
- Check creator distribution
- Verify load balancer algorithm
- Consider Redis Pub/Sub

## Future Enhancements

1. **CDN Integration**: Use Cloudflare Workers for WebSocket
2. **Edge Computing**: Deploy WebSocket servers closer to users
3. **Message Queuing**: Use RabbitMQ or Kafka for event distribution
4. **Auto-scaling**: Automatic instance scaling based on metrics
5. **Geographic Distribution**: Deploy instances in multiple regions

