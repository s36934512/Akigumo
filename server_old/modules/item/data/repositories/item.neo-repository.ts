import Neo4jBase from '@core/base.neo-repository';
import { ItemModelType } from 'libs/models/item.neogma';
import { int } from 'neo4j-driver';

interface GetItemsOptions {
    showTrash?: boolean,    // 是否顯示該資料夾內的垃圾
    pageSize?: number,      // 每頁幾筆 (預設 50)
    lastOrder?: number,     // 尋標器：上一頁最後一個項目的 order 值
}

interface GetItemsParams {
    userId: string;
    itemId?: string | null;
    options?: GetItemsOptions;
}

interface ItemNeoRepositoryDeps {
    baseNeoRepository: Neo4jBase;
    ItemModel: ItemModelType;
}

export default class ItemNeoRepository {
    constructor(private deps: ItemNeoRepositoryDeps) { }

    private get neo4jBase() { return this.deps.baseNeoRepository; }
    private get ItemModel() { return this.deps.ItemModel; }

    async upsertItemNode(id: string) {
        const cypher = `
            MERGE (i:Item {id: $id})
            RETURN i
        `;
        return this.neo4jBase.executeWrite(cypher, { id });
    }

    async upsertItemNodes(ids: string[]) {
        const cypher = `
            UNWIND $ids AS id
            MERGE (i:Item {id: id})
            RETURN i
        `;
        return this.neo4jBase.executeWrite(cypher, { ids });
    }

    //todo
    async deleteItemNode(id: string) {
        //         const cypher = `
        //             MATCH (i:Item {id: $id})
        //             DETACH DELETE i
        //             MATCH (u:User {id: $userId})-[:OWNS]->(root:root)
        // // 找到目標項目與其父節點
        // MATCH (parent:Item)-[r:CONTAINS]->(target:Item {id: $itemId})
        // // 驗證 parent 確實在該使用者的樹下
        // WHERE (root)-[:CONTAINS*0..]->(parent)

        // // 1. 斷開正常連結
        // DELETE r
        // // 2. 建立父子垃圾連結 (保留原始位置資訊)
        // CREATE (parent)-[:TRASHED]->(target)
        // // 3. 建立根部捷徑 (優化全域回收桶查詢)
        // CREATE (root)-[:GLOBAL_TRASH]->(target)
        // // 4. 標記屬性
        // SET target.isDeleted = true, target.deletedAt = datetime()
        // RETURN target.id AS deletedId, "success" AS status
        //         `;
        // return this.neo4jBase.executeWrite(cypher, { id });
    }

    //todo
    async restoreItemNode(id: string) {
        //         const cypher = `
        //             MATCH (u:User {id: $userId})-[:OWNS]->(root:root)
        // // 找到目標項目、它的父節點、以及那兩條垃圾關係
        // MATCH (root)-[g:GLOBAL_TRASH]->(target:Item {id: $itemId})
        // MATCH (parent)-[t:TRASHED]->(target)

        // // 1. 移除垃圾關係
        // DELETE g, t
        // // 2. 恢復正常層級連結
        // CREATE (parent)-[:CONTAINS]->(target)
        // // 3. 移除屬性標記
        // SET target.isDeleted = false, target.deletedAt = null
        // RETURN target.id AS restoredId, parent.id AS restoredToFolder
        //         `;
        // return this.neo4jBase.executeWrite(cypher, { id });
    }

    async getItems({ userId, itemId = null, options }: GetItemsParams) {
        const cypher = `
            // 1. 定位使用者與其 Root
            MATCH (u:User {id: $userId})
            OPTIONAL MATCH (u)-[:HAS_ROOT]->(userRoot:Root)

            // 2. 驗證請求的 itemId 是否存在且屬於該 User
            OPTIONAL MATCH (i:item {id: $itemId})-[:BELONGS_TO]->(u)

            // 3. 決定最終目標 (target)
            WITH u, userRoot, i, coalesce(i, userRoot) AS target

            // 4. 判斷這次請求的性質 (用於前端判斷)
            WITH target, 
                (CASE 
                    WHEN $itemId IS NULL OR $itemId = "" THEN "ROOT" // 正常請求首頁
                    WHEN i IS NOT NULL THEN "SUCCESS"                // 正常進入資料夾
                    ELSE "REDIRECTED"                                // 找不到或無權限，發生導回
                END) AS requestStatus

            // 5. 抓取子項目
            OPTIONAL MATCH (target)-[r:CONTAINS|TRASHED]->(child)
            WHERE 
                ( CASE WHEN $showTrash THEN true ELSE type(r) = "CONTAINS" END )
                AND
                ( CASE WHEN $lastOrder IS NOT NULL THEN r.order > $lastOrder ELSE true END )

            WITH target, requestStatus, child, r
            ORDER BY r.order ASC, child.name ASC
            LIMIT $pageSize

            // 6. 封裝成最終結果
            // 1. 在這裡進行聚合。target.id 和 requestStatus 會自動變成 Grouping Keys
            WITH target.id AS itemId, 
                requestStatus, 
                collect(CASE WHEN child IS NOT NULL THEN child {
                    .*,
                    labels: labels(child),
                    status: type(r),
                    order: r.order
                } END) AS collectedItems

            // 2. 此時所有值都已經是單一值或已處理好的列表，直接回傳物件
            RETURN {
                itemId: itemId,
                status: requestStatus,
                items: collectedItems
            } AS result
        `;

        const params = {
            userId,
            itemId,
            showTrash: false,
            pageSize: 50,
            lastOrder: -1,
            ...options
        };
        console.log('Executing getItems with params:', params); // Debug: 查看傳入的參數
        const formatParams = {
            userId: params.userId,
            itemId: params.itemId,
            showTrash: params.showTrash,
            pageSize: int(Number(params.pageSize) || 50),
            lastOrder: int(Number(params.lastOrder) || -1)
        };
        console.log('Formatted params for Neo4j query:', formatParams); // Debug: 查看格式化後的參數

        return this.neo4jBase.executeRead(cypher, formatParams);
    }

    //todo
    async getGlobalTrash(
        userId: string,
        lastDeletedAt: string, // 全域回收桶改用「刪除時間」當尋標器
        pageSize: number = 50
    ) {
        const cypher = `
        MATCH (u:User {id: $userId})-[:OWNS]->(root:root)-[:GLOBAL_TRASH]->(child)
        // 找出它原本在哪個資料夾（反向找連結）
        MATCH (parent)-[:TRASHED]->(child)
        RETURN child, parent.name AS originalFolderName, parent.id AS originalFolderId
        `;
    }
};
