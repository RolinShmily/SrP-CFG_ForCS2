# 2025-10-25

## main

### practice

- 添加死亡不掉落：

```
mp_death_drop_gun 0                    //死亡后掉落枪械（避免无法丢弃装备）
mp_death_drop_grenade 0                //死亡后不掉落投掷物
mp_death_drop_defuser 0                //死亡不掉钳子
```

> 为优化性能，在 bot 模式下无法丢弃武器，相应的 bot 也无法掉落装备。

- 默认为可掉落装备
- 添加 bot 命令添加`mp_death_drop_gun 0`
- 删除 bot 命令添加`mp_death_drop_gun 1`
- 重新开始游戏添加`mp_death_drop_gun 1`

# 2025-10-17

## custom/yszh

### autoexec

- 默认显示对局头像

```
cl_teamcounter_playercount_instead_of_avatars 0 // 显示上层对局存活数字(1)或者头像(0)
```
