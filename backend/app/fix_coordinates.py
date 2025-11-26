"""
坐标修复脚本

用于修复数据库中可能存储错误的经纬度数据。
问题：之前的代码可能将经度存为lat，纬度存为lng。

运行方法：
cd backend
source .venv/bin/activate  # 如果使用虚拟环境
python fix_coordinates.py
"""

import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker

# 导入项目的配置和模型
import sys
import os

# 确保可以导入 app 模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import get_settings
from app.models import Entry, KeyDate, Photo

settings = get_settings()


async def analyze_and_fix_coordinates(dry_run: bool = True):
    """
    分析并修复所有表中可能错误的坐标
    
    参数:
        dry_run: 如果为 True，只分析不修改；如果为 False，执行实际修复
    """
    engine = create_async_engine(settings.database_url, echo=False)
    SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)
    
    print("=" * 60)
    print("坐标修复脚本")
    print("=" * 60)
    print(f"数据库: {settings.database_url.split('@')[-1]}")  # 只显示主机部分
    print(f"模式: {'分析模式 (不修改数据)' if dry_run else '修复模式 (将修改数据)'}")
    print("=" * 60)
    
    async with SessionLocal() as session:
        total_records = 0
        need_fix_count = 0
        fixed_count = 0
        
        for Model in [Entry, KeyDate, Photo]:
            table_name = Model.__tablename__
            print(f"\n检查 {table_name} 表...")
            
            # 查询所有有坐标的记录
            result = await session.execute(
                select(Model).where(Model.lat.is_not(None), Model.lng.is_not(None))
            )
            records = result.scalars().all()
            
            table_total = len(records)
            table_need_fix = 0
            
            print(f"  找到 {table_total} 条有坐标的记录")
            
            for record in records:
                total_records += 1
                lat = record.lat
                lng = record.lng
                location = getattr(record, 'location', '') or ''
                
                # 检查是否需要交换
                # 正确情况：lat 在 [-90, 90]，lng 在 [-180, 180]
                # 错误情况：lat > 90 (实际是经度)
                needs_fix = False
                fix_reason = ""
                
                if lat is not None and lng is not None:
                    if abs(lat) > 90:
                        # lat 实际上是经度，需要交换
                        needs_fix = True
                        fix_reason = f"lat({lat}) 超出 ±90 范围，应该是经度"
                    elif abs(lng) > 180:
                        # lng 超出范围，可能数据有问题
                        fix_reason = f"lng({lng}) 超出 ±180 范围，数据异常"
                        print(f"  ⚠️  异常数据 ID={record.id}: {fix_reason}")
                
                if needs_fix:
                    need_fix_count += 1
                    table_need_fix += 1
                    
                    print(f"  发现错误 ID={record.id}:")
                    print(f"    当前: lat={lat}, lng={lng}")
                    print(f"    位置: {location[:50]}..." if len(location) > 50 else f"    位置: {location}")
                    print(f"    原因: {fix_reason}")
                    
                    if not dry_run:
                        # 交换 lat 和 lng
                        record.lat = lng
                        record.lng = lat
                        fixed_count += 1
                        print(f"    ✅ 已修复: lat={record.lat}, lng={record.lng}")
            
            print(f"  {table_name}: {table_need_fix}/{table_total} 条需要修复")
        
        print("\n" + "=" * 60)
        print("汇总")
        print("=" * 60)
        print(f"检查记录总数: {total_records}")
        print(f"需要修复: {need_fix_count}")
        
        if not dry_run and fixed_count > 0:
            await session.commit()
            print(f"✅ 已修复: {fixed_count}")
        elif dry_run and need_fix_count > 0:
            print("\n⚠️  这是分析模式，未修改任何数据。")
            print("如果要执行修复，请运行: python fix_coordinates.py --fix")
        elif need_fix_count == 0:
            print("✅ 没有发现需要修复的坐标！")
    
    await engine.dispose()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='修复数据库中错误的坐标数据')
    parser.add_argument('--fix', action='store_true', 
                        help='执行实际修复（默认只分析不修改）')
    parser.add_argument('--force', action='store_true',
                        help='不询问确认直接执行')
    
    args = parser.parse_args()
    
    dry_run = not args.fix
    
    if args.fix and not args.force:
        print("⚠️  警告：您即将修改数据库中的坐标数据！")
        print("建议在执行前备份数据库。")
        confirm = input("确定要继续吗？(输入 'yes' 确认): ")
        if confirm.lower() != 'yes':
            print("已取消操作。")
            return
    
    asyncio.run(analyze_and_fix_coordinates(dry_run=dry_run))


if __name__ == "__main__":
    main()
