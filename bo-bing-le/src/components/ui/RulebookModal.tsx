import { useState } from 'react';
import { GRIMOIRE_DEFS } from '../../data/grimoireCards';
import { getL1Pool, getL2Pool, getL3Pool } from '../../data/identityCards';

type Tab = 'basic' | 'identities' | 'grimoires' | 'tips';

interface Props {
  onClose: () => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'basic', label: '基础规则' },
  { key: 'identities', label: '身份效果' },
  { key: 'grimoires', label: '魔典效果' },
  { key: 'tips', label: 'Tips' },
];

const L1_POOL = getL1Pool();
const L2_POOL = getL2Pool();
const L3_POOL = getL3Pool();

function BasicRules() {
  return (
    <div className="space-y-6 text-text-primary text-sm leading-relaxed">
      <section>
        <h3 className="text-lg font-bold text-faction-blue mb-2">身份判定</h3>
        <p>身份分为<strong>一二三层</strong>和<strong>红蓝两派</strong>。游戏开始时，每人发一二三层各一张身份。</p>
        <p className="mt-1">第一层身份带来<strong>1层阵营浓度</strong>，第二层身份带来<strong>2层阵营浓度</strong>。阵营判定方式：比较你的蓝色浓度和红色浓度。</p>
        <p className="mt-1">若蓝色、红色浓度一样，则你为<strong className="text-faction-hybrid">混血儿</strong>。</p>
        <p className="mt-1">存在一种特殊身份叫<strong className="text-faction-alien">异族</strong>（出现在第三层），抽到异族无论前两层身份如何都会成为异族。</p>
        <p className="mt-1 text-text-dim">游戏开始时你不能看自己的身份，不知道自己的阵营和队友，需要在游戏中自行判断。</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-faction-blue mb-2">核心玩法：宣言</h3>
        <p>若你在游戏过程中猜到了自己的身份，可以在自己的回合<strong>宣布身份并展示</strong>：</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><strong className="text-accent-green">正确</strong>：发动身份上的宣言效果（通常较为强力）</li>
          <li><strong className="text-faction-red">失败</strong>：身份牌仍会被揭示，但不发动效果</li>
        </ul>
        <p className="mt-1">当你的<strong>三张身份牌全部被揭示</strong>后，你死亡。</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-faction-blue mb-2">游戏流程</h3>
        <p>每个回合开始时，你可以选择：</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><strong>获取两枚星币</strong></li>
          <li><strong>抽取一张魔典</strong></li>
        </ul>
        <div className="mt-2 p-3 bg-bg-tertiary/30 rounded-lg">
          <p className="font-bold text-accent-gold mb-1">星币作用</p>
          <p>星币可以调查或揭示他人身份（这种揭示不触发宣言）：</p>
          <ul className="list-disc list-inside mt-1 text-xs space-y-0.5">
            <li>1星币 = 调查第一层身份</li>
            <li>2星币 = 调查第二层身份</li>
            <li>揭示需双倍星币（可不调查直接揭示）</li>
            <li>调查自己也需要双倍星币（不可用星币揭示自己）</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-faction-blue mb-2">胜利条件</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-faction-alien">异族</strong>：不被第一个杀死</li>
          <li><strong className="text-faction-hybrid">混血儿</strong>：若没有异族在场，亲手杀死一个蓝或红色阵营则胜利</li>
          <li><strong className="text-faction-blue">蓝</strong>或<strong className="text-faction-red">红</strong>：若没有异族在场，对方阵营的其中一人死亡则游戏胜利</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-faction-blue mb-2">特殊规则：鸣金</h3>
        <p>若你认为场上所有玩家都为你的队友，可以跳过自己回合选择<strong>鸣金</strong>（若本回合使用过星币或魔典则无法鸣金），其他玩家可以跳过自己回合响应你。</p>
        <p className="mt-1">鸣金成功后：</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>若场上成员均为同一阵营 → <strong className="text-accent-green">共同胜利</strong></li>
          <li>若并非同一阵营 → 胜利次序：<strong className="text-faction-alien">异族</strong> &gt; <strong className="text-faction-hybrid">混血儿</strong> &gt; 人数较少的红/蓝阵营</li>
        </ul>
        <p className="mt-1">当场上<strong>魔典全部抽空</strong>后，也视为鸣金成功。</p>
      </section>
    </div>
  );
}

function IdentityRules() {
  return (
    <div className="space-y-5 text-text-primary text-sm leading-relaxed">
      <section>
        <h3 className="text-base font-bold text-faction-blue mb-2 border-b border-bg-tertiary pb-1">第一层身份（蓝/红各8张，共16张）</h3>
        <div className="space-y-2">
          {L1_POOL.map(c => (
            <div key={c.type} className="p-2 bg-bg-tertiary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-bold">{c.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${c.isPassive ? 'bg-faction-hybrid/20 text-faction-hybrid' : 'bg-accent-green/20 text-accent-green'}`}>
                  {c.isPassive ? '被动' : '宣言'}
                </span>
              </div>
              <p className="text-text-dim text-xs mt-0.5">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-base font-bold text-faction-blue mb-2 border-b border-bg-tertiary pb-1">第二层身份（蓝4种 + 红4种 + 中立2种，共10张）</h3>
        {(['blue', 'red', 'neutral'] as const).map(color => {
          const cards = L2_POOL.filter(c => c.color === color);
          if (cards.length === 0) return null;
          return (
            <div key={color} className="mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                color === 'blue' ? 'bg-faction-blue/20 text-faction-blue' :
                color === 'red' ? 'bg-faction-red/20 text-faction-red' :
                'bg-bg-tertiary/40 text-text-dim'
              }`}>
                {color === 'blue' ? '蓝色' : color === 'red' ? '红色' : '中立'}
              </span>
              <div className="space-y-1.5 mt-1">
                {cards.map(c => (
                  <div key={c.type} className="p-2 bg-bg-tertiary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{c.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${c.isPassive ? 'bg-faction-hybrid/20 text-faction-hybrid' : 'bg-accent-green/20 text-accent-green'}`}>
                        {c.isPassive ? '被动' : '宣言'}
                      </span>
                    </div>
                    <p className="text-text-dim text-xs mt-0.5">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <h3 className="text-base font-bold text-faction-blue mb-2 border-b border-bg-tertiary pb-1">第三层身份（蓝3种 + 红3种 + 中立3种，共9张）</h3>
        {(['blue', 'red', 'neutral'] as const).map(color => {
          const cards = L3_POOL.filter(c => c.color === color);
          if (cards.length === 0) return null;
          return (
            <div key={color} className="mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                color === 'blue' ? 'bg-faction-blue/20 text-faction-blue' :
                color === 'red' ? 'bg-faction-red/20 text-faction-red' :
                'bg-bg-tertiary/40 text-text-dim'
              }`}>
                {color === 'blue' ? '蓝色' : color === 'red' ? '红色' : '中立'}
              </span>
              <div className="space-y-1.5 mt-1">
                {cards.map(c => (
                  <div key={c.type} className="p-2 bg-bg-tertiary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{c.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${c.isPassive ? 'bg-faction-hybrid/20 text-faction-hybrid' : 'bg-accent-green/20 text-accent-green'}`}>
                        {c.isPassive ? '被动' : '宣言'}
                      </span>
                    </div>
                    <p className="text-text-dim text-xs mt-0.5">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function GrimoireRules() {
  const wealthCards = GRIMOIRE_DEFS.filter(d => d.type.startsWith('wealth_'));
  const bluffCards = GRIMOIRE_DEFS.filter(d => d.type.startsWith('bluff_'));
  const functionalCards = GRIMOIRE_DEFS.filter(d => !d.isConspiracy && !d.isBluff && !d.type.startsWith('wealth_'));
  const conspiracyCards = GRIMOIRE_DEFS.filter(d => d.isConspiracy);

  return (
    <div className="space-y-5 text-text-primary text-sm leading-relaxed">
      {wealthCards.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-accent-gold mb-2 border-b border-bg-tertiary pb-1">财富 ({wealthCards.length}张)</h3>
          <div className="space-y-1.5">
            {wealthCards.map(c => (
              <div key={c.type} className="p-2 bg-bg-tertiary/20 rounded-lg flex items-center gap-2">
                <span className="font-bold">{c.name}</span>
                <span className="text-text-dim text-xs">{c.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {bluffCards.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-faction-alien mb-2 border-b border-bg-tertiary pb-1">矫饰 ({bluffCards.length}张)</h3>
          <div className="space-y-1.5">
            {bluffCards.map(c => (
              <div key={c.type} className="p-2 bg-bg-tertiary/20 rounded-lg flex items-center gap-2">
                <span className="font-bold">{c.name}</span>
                <span className="text-text-dim text-xs">{c.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {functionalCards.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-accent-green mb-2 border-b border-bg-tertiary pb-1">功能 ({functionalCards.length}张)</h3>
          <div className="space-y-1.5">
            {functionalCards.map(c => (
              <div key={c.type} className="p-2 bg-bg-tertiary/20 rounded-lg flex items-center gap-2">
                <span className="font-bold">{c.name}</span>
                <span className="text-text-dim text-xs">{c.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {conspiracyCards.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-faction-red mb-2 border-b border-bg-tertiary pb-1">阴谋 ({conspiracyCards.length}张)</h3>
          <div className="space-y-1.5">
            {conspiracyCards.map(c => (
              <div key={c.type} className="p-2 bg-bg-tertiary/20 rounded-lg flex items-center gap-2">
                <span className="font-bold">{c.name}</span>
                <span className="text-text-dim text-xs">{c.desc}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Tips() {
  return (
    <div className="space-y-4 text-text-primary text-sm leading-relaxed">
      <div className="p-3 bg-accent-gold/10 border border-accent-gold/20 rounded-lg">
        <p><strong>Tip 1:</strong> 当场上剩余魔典少于10张时，在回合开始时可以选择获取<strong>三枚星币</strong>。</p>
      </div>
      <div className="p-3 bg-faction-alien/10 border border-faction-alien/20 rounded-lg">
        <p><strong>Tip 2:</strong> 当你使用阴谋时，需要把这张魔典<strong>横置在你面前</strong>，当满足条件时，效果必须触发。</p>
      </div>
      <div className="p-3 bg-faction-blue/10 border border-faction-blue/20 rounded-lg">
        <p><strong>Tip 3:</strong> 宣言是游戏的核心机制。即使你不确定自己的身份，有时冒险宣言也可能带来转机——但失败会暴露你的身份信息给其他玩家。</p>
      </div>
      <div className="p-3 bg-faction-hybrid/10 border border-faction-hybrid/20 rounded-lg">
        <p><strong>Tip 4:</strong> 魔典数量有限，抽完后自动鸣金。如果你觉得局势对自己有利，可以加快抽牌节奏；反之则应谨慎使用魔典。</p>
      </div>
    </div>
  );
}

export function RulebookModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('basic');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-primary border border-bg-tertiary/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-tertiary/20">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            📖 规则书
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-tertiary/30 hover:bg-bg-tertiary/50 flex items-center justify-center text-text-dim hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-bg-tertiary/10 bg-bg-secondary/30 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                tab === t.key
                  ? 'bg-faction-blue/20 text-faction-blue border border-faction-blue/30'
                  : 'text-text-dim hover:text-text-primary hover:bg-bg-tertiary/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'basic' && <BasicRules />}
          {tab === 'identities' && <IdentityRules />}
          {tab === 'grimoires' && <GrimoireRules />}
          {tab === 'tips' && <Tips />}
        </div>
      </div>
    </div>
  );
}
