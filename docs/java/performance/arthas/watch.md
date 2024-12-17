# watch

核心结构：
```java
public class Advice {

    private final ClassLoader loader;
    private final Class<?> clazz;
    private final ArthasMethod method;
    private final Object target;
    private final Object[] params;
    private final Object returnObj;
    private final Throwable throwExp;
    private final boolean isBefore;
    private final boolean isThrow;
    private final boolean isReturn;

    // getter/setter
}
```

方法结构
```java
    private ErrorCode commonUseSkill(Skill skill, Vec2 forward, long targetUid, float distance) {}
```

- 查看方法执行数据, 只看参数 输出层级3 输出5条 耗时大于0.1ms的:`watch com.qgame.fight.scene.gameobj.component.SkillComponent commonUseSkill '{params}' '#cost>0.1' -n 5  -x 3`
- `watch com.qgame.fight.scene.gameobj.component.SkillComponent commonUseSkill '{params}' '#cost>0.1' -n 5  -x 3`
- `watch com.qgame.fight.scene.framework.system.SceneSystem fixedUpdate '{params,returnObj,throwExp}' '#cost>10' -n 5  -x 3`
```shell
Affect(class count: 1 , method count: 1) cost in 77 ms, listenerId: 16
method=com.qgame.fight.scene.gameobj.component.SkillComponent.commonUseSkill location=AtExit
ts=2024-10-14 18:07:04.795; [cost=0.471ms] result=@ArrayList[
    @Object[][
        @NormalAttack[
            log=@Logger[Logger[com.qgame.fight.scene.components.skill.SkillCaster]],
            isInterrupt=@Boolean[false],
            castDecorators=@ArrayList[isEmpty=false;size=1],
            backDecorators=@ArrayList[isEmpty=true;size=0],
            effects=@ArrayList[isEmpty=false;size=1],
            currStateList=@ArrayList[isEmpty=true;size=0],
            log=@Logger[Logger[com.qgame.fight.scene.components.skill.Skill]],
            skillComp=@SkillComponent[com.qgame.fight.scene.gameobj.component.SkillComponent@43a2c482],
            skillId=@Integer[60100101],
            usedTime=@Long[1728900424794],
            skillCD=@Integer[0],
            level=@Integer[1],
            castPointTime=@Integer[167],
            spellTime=@Integer[0],
            shakeTime=@Integer[155],
            phase=@Integer[0],
            phaseTime=@Integer[0],
            castPointSlowDown=@Boolean[true],
            targetUid=@Long[0],
            distance=@Float[0.0],
            compEventTypes=@HashSet[isEmpty=true;size=0],
            needTick=@Boolean[false],
            imageSkill=@Boolean[false],
        ],
        @Vec2[
            serialVersionUID=@Long[1],
            zero=@Vec2[(0.0,0.0)],
            x=@Float[-0.96897686],
            y=@Float[0.24715151],
            $assertionsDisabled=@Boolean[true],
        ],
        @Long[0],
        @Float[0.0],
    ],
]
```

- 单纯查看结果: `watch com.qgame.fight.scene.gameobj.component.SkillComponent commonUseSkill '{returnObj}'`
```shell
[arthas@31056]$ watch com.qgame.fight.scene.gameobj.component.SkillComponent commonUseSkill '{returnObj}'
Press Q or Ctrl+C to abort.
Affect(class count: 1 , method count: 1) cost in 67 ms, listenerId: 18
method=com.qgame.fight.scene.gameobj.component.SkillComponent.commonUseSkill location=AtExit
ts=2024-10-14 18:09:52.731; [cost=0.3825ms] result=@ArrayList[
    @ErrorCode[SUCCESS],
]
```

- 根据技能id筛选: `watch com.qgame.fight.scene.gameobj.component.SkillComponent commonUseSkill '{params}' 'params[0].skillId==60100101' -n 5  -x 3`
- 根据玩家uid筛选`watch com.qgame.fight.scene.gameobj.component.SkillComponent commonUseSkill '{params[0]}' 'params[0].skillComp.entity.uid == 1000006336'`

```shell
[arthas@31056]$ watch com.qgame.fight.scene.gameobj.component.SkillComponent commonUseSkill '{params[0]}' 'params[0].skillComp.entity.uid == 1000006336'
Press Q or Ctrl+C to abort.
Affect(class count: 1 , method count: 1) cost in 67 ms, listenerId: 27
method=com.qgame.fight.scene.gameobj.component.SkillComponent.commonUseSkill location=AtExit
ts=2024-10-14 18:19:19.422; [cost=0.3418ms] result=@ArrayList[
    @NormalAttack[normalAttack{skillId=60100101}],
]
```

- 构造函数: `watch demo.MathGame <init> '{params,returnObj,throwExp}' -v`
- 内部类: `watch OuterClass$InnerClass`
- 不支持lambda生成的类。