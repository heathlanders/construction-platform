# API Versioning Skill
**Locked decisions: T-11**

## URL versioning (locked)
All API routes use `/v1/` path prefix.
```
https://api.platform.com/v1/projects
https://api.platform.com/v1/tenants/{id}/users
```

## Breaking change policy
- Breaking changes introduce a new version (`/v2/`)
- 6-month deprecation window for old version after new version ships
- Notify tenants of deprecation via email + API response headers
- Non-breaking changes (new optional fields, new endpoints) do NOT require a new version

## What counts as a breaking change
- Removing a field from a response
- Changing a field's type
- Renaming a field
- Changing an endpoint's URL
- Removing an endpoint
- Making a previously optional field required

## What is NOT a breaking change
- Adding new optional fields to responses
- Adding new endpoints
- Adding new optional request parameters

## User-Agent requirement (T-11)
Every API request must include a `User-Agent` header.
Reject requests without it: `400 Bad Request`.
```
User-Agent: ConstructionPlatform-Web/1.0
User-Agent: ConstructionPlatform-Mobile/2.3.1 iOS/17.0
User-Agent: ConstructionPlatform-API-Client/1.0
```

## Deprecation response headers
When a deprecated version is used:
```
Sunset: Sat, 01 Jan 2027 00:00:00 GMT
Deprecation: true
Link: <https://api.platform.com/v2/...>; rel="successor-version"
```
