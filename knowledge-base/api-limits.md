# API Rate Limits

CloudFlow API rate limits vary by plan:

| Plan       | Requests/minute | Requests/day |
|------------|-----------------|--------------|
| Free       | 60              | 1,000        |
| Pro        | 600             | 50,000       |
| Business   | 3,000           | 500,000      |
| Enterprise | Custom          | Custom       |

## Rate Limit Headers

Every API response includes:
- `X-RateLimit-Limit`: your per-minute limit
- `X-RateLimit-Remaining`: requests remaining in the current window
- `X-RateLimit-Reset`: Unix timestamp when the window resets

## Exceeding Limits

When you exceed your rate limit, the API returns HTTP 429 with a `Retry-After` header (in seconds).

## Webhooks

Webhook deliveries count toward your API rate limit. Failed webhook retries use exponential backoff: 1 min, 5 min, 30 min, then 2 hours (max 5 attempts).

## Increasing Limits

Pro and Business customers can request a temporary limit increase by contacting support with your use case. Enterprise customers have negotiated limits in their contract.
