# spinal-organ-calculate-dashboard-data

spinal-organ-calculate-dashboard-data is an organ that calculates the value of an equipment according to its sub-equipments.
This calculation is done following rules (sum, average, maximum, minimum or reference).

# Config

The organ must get the forgeFile to work. for this you must specify the user information, host, port and forgeFile path. This data must be in config.json file, so Edit it.

# Installation

clone the project by typing the command bellow on the console or go to https://github.com/spinalcom/spinal-organ-calculate-dashboard-data.git and download it

```
git clone https://github.com/spinalcom/spinal-organ-calculate-dashboard-data.git
```

Go to the project file and install the dependencies

```
cd spinal-organ-calculate-dashboard-data
npm install
```

The organ can be run with :

- node :

```
npm run start
```

- pm2

```
npm run pm2
```
