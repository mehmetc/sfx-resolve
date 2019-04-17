# sfx-resolve
Resolves an OpenURL against an SFX instance

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
