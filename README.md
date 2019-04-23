# sfx-resolve
Resolves an OpenURL against an SFX instance

## Docker
``` bash
docker run -p 3000:3000 -v /path/to/config.json:/app/config.json -v /path/to/cache:/app/cache sfx-resolve:latest
```

## Install
``` bash 
yarn global add sfx-resolve
```

OR

``` bash
npm install sfx-resolve -g
```

## Start
```bash
$ sfxResolve
```

## Configuration (config.json)

- endpoints: is a list of SFX servers that will be queried
  - code: code of the SFX server
  - name: display name of the SFX server
  - url: SFX endpoint
- cache: a path to where the cache can be stored


```json
{
    "endpoints": [
        {"code": "a1", "name": "University of A", "url": "https://sfx.a.edu/sfx-a"},
        {"code": "b1", "name": "University of B", "url": "https://sfx.b.edu/sfx-b"}      
    ],
    "cache": "./cache"    
}
```

## Usage
- ip: optional IP address of caller
- url: OpenUrl to resolve

```
http://127.0.0.1:3000?ip=1.1.1.1&url=http://sfx.service.com?ctx_ver=Z39.88-2004 ...
```

